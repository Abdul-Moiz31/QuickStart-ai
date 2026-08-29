import { Queue } from "bullmq";
import type { DomainEventInput } from "./types.js";
export declare function getEventsQueue(redisUrl: string): Queue;
export declare function persistAndEnqueueEvents(opts: {
    projectId: string;
    events: DomainEventInput[];
    redisUrl: string;
}): Promise<string[]>;
//# sourceMappingURL=emit.d.ts.map