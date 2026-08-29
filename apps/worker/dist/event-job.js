import { Worker, Queue } from "bullmq";
import { prisma } from "@quickstart-ai/db";
import { deliverProjectEvent, retryDelivery } from "@quickstart-ai/events";
import { QUEUE_NAMES } from "@quickstart-ai/shared";
export function startEventsWorkers(redisUrl) {
    const retryQueue = new Queue(QUEUE_NAMES.EVENTS_RETRY, {
        connection: { url: redisUrl },
        defaultJobOptions: { removeOnComplete: 500, removeOnFail: 100 },
    });
    const eventsWorker = new Worker(QUEUE_NAMES.EVENTS, async (job) => {
        const { eventId } = job.data;
        await deliverProjectEvent(eventId);
        const failed = await prisma.webhookDelivery.findMany({
            where: { eventId, status: "retrying", nextRetryAt: { not: null } },
        });
        for (const d of failed) {
            if (!d.nextRetryAt)
                continue;
            const delay = Math.max(0, d.nextRetryAt.getTime() - Date.now());
            await retryQueue.add("retry-delivery", { deliveryId: d.id }, { delay, removeOnComplete: 500, removeOnFail: 100 });
        }
    }, { connection: { url: redisUrl }, concurrency: 10 });
    const retryWorker = new Worker(QUEUE_NAMES.EVENTS_RETRY, async (job) => {
        const { deliveryId } = job.data;
        await retryDelivery(deliveryId);
        const delivery = await prisma.webhookDelivery.findUnique({
            where: { id: deliveryId },
        });
        if (delivery?.status === "retrying" && delivery.nextRetryAt) {
            const delay = Math.max(0, delivery.nextRetryAt.getTime() - Date.now());
            await retryQueue.add("retry-delivery", { deliveryId }, { delay, removeOnComplete: 500, removeOnFail: 100 });
        }
    }, { connection: { url: redisUrl }, concurrency: 5 });
    eventsWorker.on("failed", (job, err) => {
        console.error(`[events] failed job ${job?.id}`, err.message);
    });
    retryWorker.on("failed", (job, err) => {
        console.error(`[events-retry] failed job ${job?.id}`, err.message);
    });
    return { eventsWorker, retryWorker };
}
//# sourceMappingURL=event-job.js.map