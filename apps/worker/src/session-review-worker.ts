import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@quickstart-ai/shared";
import { runSessionReview } from "./session-review-job.js";

export function startSessionReviewWorker(redisUrl: string) {
  const worker = new Worker(
    QUEUE_NAMES.SESSION_REVIEW,
    async (job) => {
      const { projectId, sessionId } = job.data as {
        projectId: string;
        sessionId: string;
      };
      console.log(`[session-review] processing ${sessionId}`);
      const result = await runSessionReview({ projectId, sessionId });
      if (result.skipped) {
        console.log(`[session-review] skipped ${sessionId}: ${result.reason}`);
        return;
      }
      console.log(`[session-review] done ${sessionId}`);
    },
    {
      connection: { url: redisUrl },
      concurrency: 2,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[session-review] failed job ${job?.id}`, err.message);
  });

  return worker;
}
