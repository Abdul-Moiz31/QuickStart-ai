import { Worker } from "bullmq";
import { prisma } from "@quickstart-ai/db";
import {
  chunkText,
  createEmbeddingsClient,
  storeChunkEmbeddings,
} from "@quickstart-ai/rag";
import { QUEUE_NAMES, buildEmbeddingsRuntimeConfig } from "@quickstart-ai/shared";
import { decryptSecret } from "@quickstart-ai/shared/secrets";

export async function processIngest(documentId: string, projectId: string) {
  await prisma.knowledgeDocument.update({
    where: { id: documentId },
    data: { status: "PROCESSING", error: null },
  });

  const doc = await prisma.knowledgeDocument.findUnique({ where: { id: documentId } });
  if (!doc || doc.projectId !== projectId) {
    throw new Error("Document not found");
  }

  await prisma.knowledgeChunk.deleteMany({ where: { documentId } });
  const chunks = chunkText(doc.rawContent);
  if (!chunks.length) {
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: "FAILED", error: "No chunks produced" },
    });
    return;
  }

  const created = await prisma.$transaction(
    chunks.map((content, chunkIndex) =>
      prisma.knowledgeChunk.create({
        data: {
          documentId,
          projectId,
          content,
          chunkIndex,
          tokenCount: Math.ceil(content.length / 4),
        },
      }),
    ),
  );

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  const embeddingsRuntime = project
    ? buildEmbeddingsRuntimeConfig(project, decryptSecret)
    : undefined;
  const embeddings = createEmbeddingsClient(embeddingsRuntime);
  const vectors = await embeddings.embed(chunks);
  await storeChunkEmbeddings(
    created.map((c) => c.id),
    vectors,
  );

  await prisma.knowledgeDocument.update({
    where: { id: documentId },
    data: { status: "READY" },
  });

  await prisma.usageEvent.create({
    data: {
      projectId,
      kind: "ingest_document",
      units: chunks.length,
      meta: { documentId },
    },
  });
}

export function startIngestWorker(redisUrl: string) {
  const worker = new Worker(
    QUEUE_NAMES.INGEST,
    async (job) => {
      const { documentId, projectId } = job.data as {
        documentId: string;
        projectId: string;
      };
      console.log(`[ingest] processing ${documentId}`);
      try {
        await processIngest(documentId, projectId);
        console.log(`[ingest] ready ${documentId}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "ingest failed";
        await prisma.knowledgeDocument.update({
          where: { id: documentId },
          data: { status: "FAILED", error: message },
        });
        throw err;
      }
    },
    {
      connection: { url: redisUrl },
      concurrency: 2,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[ingest] failed job ${job?.id}`, err.message);
  });

  return worker;
}
