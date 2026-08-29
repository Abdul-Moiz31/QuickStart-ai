import type { ChatEventContext } from "./types.js";
export declare function collectAndEmitChatEvents(ctx: ChatEventContext & {
    redisUrl: string;
    webAppUrl?: string;
}): Promise<string[]>;
export declare function emitTestEvent(opts: {
    projectId: string;
    type: string;
    redisUrl: string;
    sessionId?: string;
}): Promise<string | null>;
//# sourceMappingURL=collect.d.ts.map