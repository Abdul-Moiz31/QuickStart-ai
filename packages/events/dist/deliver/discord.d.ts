import type { EventEnvelope } from "../types.js";
export declare function formatDiscordMessage(envelope: EventEnvelope): Record<string, unknown>;
export declare function postToDiscord(webhookUrl: string, body: Record<string, unknown>): Promise<number>;
//# sourceMappingURL=discord.d.ts.map