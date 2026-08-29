import type { EventEnvelope } from "../types.js";
export declare function postWebhook(url: string, secret: string, envelope: EventEnvelope, deliveryId: string): Promise<number>;
export declare const RETRY_DELAYS_MS: number[];
export declare function nextRetryDelay(attempts: number): number | null;
//# sourceMappingURL=webhook.d.ts.map