import type { EventEnvelope } from "../types.js";
export declare function formatSlackMessage(envelope: EventEnvelope): Record<string, unknown>;
export declare function postToSlack(webhookUrl: string, body: Record<string, unknown>): Promise<number>;
//# sourceMappingURL=slack.d.ts.map