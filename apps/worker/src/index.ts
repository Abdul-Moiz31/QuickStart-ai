import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "bullmq";
import { prisma, ensurePgvector } from "@quickstart-ai/db";
import {
  chunkText,
  createEmbeddingsClient,
  storeChunkEmbeddings,
} from "@quickstart-ai/rag";
import { QUEUE_NAMES, buildLlmRuntimeConfig } from "@quickstart-ai/shared";
import { decryptSecret } from "@quickstart-ai/shared/secrets";
import { startEvalWorker } from "./eval-job.js";
import { startEventsWorkers } from "./event-job.js";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
config({ path: resolve(root, ".env") });

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

async function processIngest(documentId: string, projectId: string) {
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
  const llmRuntime = project ? buildLlmRuntimeConfig(project, decryptSecret) : undefined;
  const embeddings = createEmbeddingsClient(llmRuntime);
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

async function main() {
  await prisma.$connect();
  await ensurePgvector();

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

  const evalWorker = startEvalWorker(redisUrl);
  const { eventsWorker, retryWorker } = startEventsWorkers(redisUrl);

  console.log(
    "QuickStart worker listening on queues:",
    QUEUE_NAMES.INGEST,
    QUEUE_NAMES.EVAL,
    QUEUE_NAMES.EVENTS,
    QUEUE_NAMES.EVENTS_RETRY,
  );

  const allWorkers = [worker, evalWorker, eventsWorker, retryWorker];

  async function shutdown(signal: string) {
    console.log(`[worker] ${signal} received — draining in-flight jobs…`);
    await Promise.allSettled(allWorkers.map((w) => w.close()));
    await prisma.$disconnect();
    console.log("[worker] clean shutdown complete");
    process.exit(0);
  }

  // Force-exit after 30 s if jobs don't drain in time
  const shutdownTimer = setTimeout(() => {
    console.error("[worker] shutdown timeout — forcing exit");
    process.exit(1);
  }, 30_000);
  shutdownTimer.unref();

  process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
  process.on("SIGINT",  () => { void shutdown("SIGINT"); });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
