/** Built-in event types emitted by the chatbot platform. */
export declare const BUILTIN_EVENT_TYPES: {
    readonly CONVERSATION_STARTED: "conversation.started";
    readonly LEAD_CAPTURED: "lead.captured";
    readonly HUMAN_HANDOFF: "human.handoff.requested";
    readonly ISSUE_REPORTED: "issue.reported";
    readonly KNOWLEDGE_GAP: "knowledge.gap";
    readonly TEST_PING: "test.ping";
};
export type BuiltinEventType = (typeof BUILTIN_EVENT_TYPES)[keyof typeof BUILTIN_EVENT_TYPES];
export interface EventCatalogEntry {
    type: string;
    name: string;
    description: string;
    /** Hint for LLM tool planner and custom rule builder. */
    llmHint: string;
    category: "conversation" | "sales" | "support" | "quality" | "system";
}
export declare const EVENT_CATALOG: EventCatalogEntry[];
export declare function getEventCatalogEntry(type: string): EventCatalogEntry | undefined;
export declare function resolveEventMeta(type: string, custom?: {
    name?: string;
    description?: string;
}): {
    name: string;
    description: string;
};
//# sourceMappingURL=events.d.ts.map