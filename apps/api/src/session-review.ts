import { Queue } from "bullmq";
import { prisma } from "@quickstart-ai/db";
import { QUEUE_NAMES, SESSION_REVIEW_IDLE_MS } from "@quickstart-ai/shared";
import { env } from "./env.js";

function getSessionReviewQueue() {
  return new Queue(QUEUE_NAMES.SESSION_REVIEW, {
    connection: { url: env.redisUrl },
  });
}

/**
 * Schedules an LLM review after the session goes quiet. Each new message
 * replaces the pending job so we only review once activity stops.
 */
export async function scheduleSessionReview(opts: {
  projectId: string;
  sessionId: string;
}): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: opts.projectId },
    select: { sessionReviewEnabled: true },
  });
  if (!project?.sessionReviewEnabled) return;

  const queue = getSessionReviewQueue();
  try {
    await queue.add(
      "review-session",
      { projectId: opts.projectId, sessionId: opts.sessionId },
      {
        jobId: `review:${opts.sessionId}`,
        delay: SESSION_REVIEW_IDLE_MS,
        removeOnComplete: 50,
        removeOnFail: 25,
      },
    );
  } finally {
    await queue.close();
  }
}
