import type { DomainEventInput } from "./types.js";
export declare function detectHeuristicEvents(ctx: {
    userMessage: string;
    confidence: "high" | "medium" | "low";
    chunkCount: number;
    topScore?: number;
    sessionId: string;
}): DomainEventInput[];
//# sourceMappingURL=heuristics.d.ts.map