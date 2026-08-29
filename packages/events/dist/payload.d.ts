import type { EventEnvelope } from "./types.js";
export declare function buildEventEnvelope(input: {
    id: string;
    type: string;
    name: string;
    description: string;
    projectId: string;
    createdAt: Date;
    data: Record<string, unknown>;
}): EventEnvelope;
//# sourceMappingURL=payload.d.ts.map