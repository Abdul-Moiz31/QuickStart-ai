import { Worker } from "bullmq";
import { prisma } from "@quickstart-ai/db";
import { executeProjectEval } from "@quickstart-ai/eval";
import { QUEUE_NAMES } from "@quickstart-ai/shared";

export function startEvalWorker(redisUrl: string) {
  const worker = new Worker(
    QUEUE_NAMES.EVAL,
    async (job) => {
      const { runId, projectId } = job.data as { runId: string; projectId: string };
      console.log(`[eval] processing run ${runId} for project ${projectId}`);
      try {
        const result = await executeProjectEval(runId, projectId);
        console.log(`[eval] finished ${runId} passed=${result.passed}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "eval failed";
        await prisma.evalRun.update({
          where: { id: runId },
          data: {
            status: "failed",
            finishedAt: new Date(),
            metrics: {
              error: message,
              progress: {
                current: 0,
                total: 0,
                message: message,
                phase: "done",
              },
            },
          },
        });
        throw err;
      }
    },
    {
      connection: { url: redisUrl },
      concurrency: 1,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[eval] failed job ${job?.id}`, err.message);
  });

  return worker;
}
