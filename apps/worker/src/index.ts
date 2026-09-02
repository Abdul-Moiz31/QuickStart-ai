import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma, ensurePgvector } from "@quickstart-ai/db";
import { QUEUE_NAMES } from "@quickstart-ai/shared";
import { startEvalWorker } from "./eval-job.js";
import { startEventsWorkers } from "./event-job.js";
import { startIngestWorker } from "./ingest-job.js";
import { startOnboardingScanWorker } from "./onboarding-scan-job.js";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
config({ path: resolve(root, ".env") });

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

async function main() {
  await prisma.$connect();
  await ensurePgvector();

  const worker = startIngestWorker(redisUrl);
  const evalWorker = startEvalWorker(redisUrl);
  const { eventsWorker, retryWorker } = startEventsWorkers(redisUrl);
  const onboardingScanWorker = startOnboardingScanWorker(redisUrl);

  console.log(
    "QuickStart worker listening on queues:",
    QUEUE_NAMES.INGEST,
    QUEUE_NAMES.EVAL,
    QUEUE_NAMES.EVENTS,
    QUEUE_NAMES.EVENTS_RETRY,
    QUEUE_NAMES.ONBOARDING_SCAN,
  );

  const allWorkers = [worker, evalWorker, eventsWorker, retryWorker, onboardingScanWorker];

  async function shutdown(signal: string) {
    console.log(`[worker] ${signal} received — draining in-flight jobs…`);
    const shutdownTimer = setTimeout(() => {
      console.error("[worker] shutdown timeout — forcing exit");
      process.exit(1);
    }, 30_000);
    shutdownTimer.unref();
    await Promise.allSettled(allWorkers.map((w) => w.close()));
    clearTimeout(shutdownTimer);
    await prisma.$disconnect();
    console.log("[worker] clean shutdown complete");
    process.exit(0);
  }

  process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
  process.on("SIGINT",  () => { void shutdown("SIGINT"); });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
