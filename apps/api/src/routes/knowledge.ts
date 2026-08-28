import type { FastifyInstance } from "fastify";
import { Queue } from "bullmq";
import { prisma } from "@quickstart-ai/db";
import {
  AppError,
  deleteKnowledgeQaSchema,
  ingestTextSchema,
  NotFoundError,
  QUEUE_NAMES,
  removeQaAtIndex,
  replaceQaAtIndex,
  updateKnowledgeDocSchema,
  updateKnowledgeQaSchema,
} from "@quickstart-ai/shared";
import { requireAuth } from "../auth.js";
import { invalidateGapCache } from "../knowledge-gaps.js";
import { env } from "../env.js";

function getIngestQueue() {
  return new Queue(QUEUE_NAMES.INGEST, {
    connection: { url: env.redisUrl },
  });
}

async function enqueueIngest(documentId: string, projectId: string) {
  const queue = getIngestQueue();
  try {
    await queue.add(
      "ingest-document",
      { documentId, projectId },
      {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      },
    );
  } finally {
    await queue.close();
  }
}

export async function knowledgeRoutes(app: FastifyInstance) {
  app.post("/api/v1/projects/:id/knowledge", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
    });
    if (!project) throw new NotFoundError("Project not found");

    const body = ingestTextSchema.parse(req.body);
    const doc = await prisma.knowledgeDocument.create({
      data: {
        projectId: id,
        title: body.title,
        sourceType: body.sourceType,
        rawContent: body.content,
        status: "PENDING",
      },
    });

    try {
      await enqueueIngest(doc.id, id);
    } catch (err) {
      await prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: {
          status: "FAILED",
          error: err instanceof Error ? err.message : "Failed to enqueue ingest",
        },
      });
      throw new AppError("Failed to enqueue ingest job. Is Redis running?", 503);
    }

    // The Gaps tab tells the user an answered gap disappears once the knowledge is
    // live. A ten minute cache would make that a lie for ten minutes.
    void invalidateGapCache(id);

    return { success: true, document: doc };
  });

  app.post("/api/v1/projects/:id/knowledge/:docId/retry", async (req) => {
    await requireAuth(req);
    const { id, docId } = req.params as { id: string; docId: string };
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
    });
    if (!project) throw new NotFoundError("Project not found");

    const doc = await prisma.knowledgeDocument.findFirst({
      where: { id: docId, projectId: id },
    });
    if (!doc) throw new NotFoundError("Document not found");

    if (doc.status === "PROCESSING") {
      throw new AppError("Document is already processing", 409);
    }

    await prisma.knowledgeDocument.update({
      where: { id: docId },
      data: { status: "PENDING", error: null },
    });

    try {
      await enqueueIngest(docId, id);
    } catch (err) {
      await prisma.knowledgeDocument.update({
        where: { id: docId },
        data: {
          status: "FAILED",
          error: err instanceof Error ? err.message : "Failed to enqueue retry",
        },
      });
      throw new AppError("Failed to enqueue retry. Is Redis running?", 503);
    }

    const updated = await prisma.knowledgeDocument.findUnique({ where: { id: docId } });
    return { success: true, document: updated, message: "Ingest re-queued" };
  });

  app.get("/api/v1/projects/:id/knowledge", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
    });
    if (!project) throw new NotFoundError("Project not found");
    const documents = await prisma.knowledgeDocument.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { chunks: true } } },
    });
    return { success: true, documents };
  });

  app.patch("/api/v1/projects/:id/knowledge/:docId", async (req) => {
    await requireAuth(req);
    const { id, docId } = req.params as { id: string; docId: string };
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
    });
    if (!project) throw new NotFoundError("Project not found");

    const doc = await prisma.knowledgeDocument.findFirst({
      where: { id: docId, projectId: id },
    });
    if (!doc) throw new NotFoundError("Document not found");

    const qaBody = updateKnowledgeQaSchema.safeParse(req.body);
    if (qaBody.success) {
      const { qaIndex, question, answer } = qaBody.data;
      let rawContent: string;
      try {
        rawContent = replaceQaAtIndex(doc.rawContent, qaIndex, question, answer);
      } catch {
        throw new AppError("Invalid Q&A index", 400);
      }
      await prisma.knowledgeChunk.deleteMany({ where: { documentId: docId } });
      const updated = await prisma.knowledgeDocument.update({
        where: { id: docId },
        data: { rawContent, status: "PENDING", error: null },
      });
      await enqueueIngest(docId, id);
      return { success: true, document: updated };
    }

    const body = updateKnowledgeDocSchema.parse(req.body);
    if (!body.title && !body.content) {
      throw new AppError("Provide title and/or content to update", 400);
    }
    await prisma.knowledgeChunk.deleteMany({ where: { documentId: docId } });
    const updated = await prisma.knowledgeDocument.update({
      where: { id: docId },
      data: {
        title: body.title ?? doc.title,
        rawContent: body.content ?? doc.rawContent,
        status: "PENDING",
        error: null,
      },
    });
    await enqueueIngest(docId, id);
    return { success: true, document: updated };
  });

  app.delete("/api/v1/projects/:id/knowledge/:docId", async (req) => {
    await requireAuth(req);
    const { id, docId } = req.params as { id: string; docId: string };
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
    });
    if (!project) throw new NotFoundError("Project not found");

    const doc = await prisma.knowledgeDocument.findFirst({
      where: { id: docId, projectId: id },
    });
    if (!doc) throw new NotFoundError("Document not found");

    await prisma.knowledgeDocument.delete({ where: { id: docId } });
    return { success: true, message: "Document deleted" };
  });

  app.delete("/api/v1/projects/:id/knowledge/:docId/qa", async (req) => {
    await requireAuth(req);
    const { id, docId } = req.params as { id: string; docId: string };
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
    });
    if (!project) throw new NotFoundError("Project not found");

    const doc = await prisma.knowledgeDocument.findFirst({
      where: { id: docId, projectId: id },
    });
    if (!doc) throw new NotFoundError("Document not found");

    const body = deleteKnowledgeQaSchema.parse(req.body);
    let rawContent: string;
    try {
      rawContent = removeQaAtIndex(doc.rawContent, body.qaIndex);
    } catch {
      throw new AppError("Invalid Q&A index", 400);
    }

    await prisma.knowledgeChunk.deleteMany({ where: { documentId: docId } });
    const updated = await prisma.knowledgeDocument.update({
      where: { id: docId },
      data: { rawContent, status: "PENDING", error: null },
    });
    await enqueueIngest(docId, id);
    return { success: true, document: updated };
  });
}
