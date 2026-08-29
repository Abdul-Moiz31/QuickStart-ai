/** Built-in event types emitted by the chatbot platform. */
export const BUILTIN_EVENT_TYPES = {
  CONVERSATION_STARTED: "conversation.started",
  LEAD_CAPTURED: "lead.captured",
  HUMAN_HANDOFF: "human.handoff.requested",
  ISSUE_REPORTED: "issue.reported",
  KNOWLEDGE_GAP: "knowledge.gap",
  TEST_PING: "test.ping",
} as const;

export type BuiltinEventType = (typeof BUILTIN_EVENT_TYPES)[keyof typeof BUILTIN_EVENT_TYPES];

export interface EventCatalogEntry {
  type: string;
  name: string;
  description: string;
  /** Hint for LLM tool planner and custom rule builder. */
  llmHint: string;
  category: "conversation" | "sales" | "support" | "quality" | "system";
}

export const EVENT_CATALOG: EventCatalogEntry[] = [
  {
    type: BUILTIN_EVENT_TYPES.CONVERSATION_STARTED,
    name: "Conversation Started",
    description: "A new visitor started a chat session.",
    llmHint: "Fires once when a visitor opens chat and submits their name and email.",
    category: "conversation",
  },
  {
    type: BUILTIN_EVENT_TYPES.LEAD_CAPTURED,
    name: "Lead Captured",
    description: "A visitor shared contact details for follow-up or a demo.",
    llmHint: "Use when the visitor provides name/email and asks for pricing, demo, callback, or sales contact.",
    category: "sales",
  },
  {
    type: BUILTIN_EVENT_TYPES.HUMAN_HANDOFF,
    name: "Human Handoff Requested",
    description: "The bot escalated to a human agent or the visitor asked to speak with someone.",
    llmHint: "Use when the visitor explicitly asks for a human, or the bot cannot answer confidently.",
    category: "support",
  },
  {
    type: BUILTIN_EVENT_TYPES.ISSUE_REPORTED,
    name: "Issue Reported",
    description: "A visitor reported a bug, error, or product problem.",
    llmHint: "Use when the visitor describes something broken, not working, or an error message.",
    category: "support",
  },
  {
    type: BUILTIN_EVENT_TYPES.KNOWLEDGE_GAP,
    name: "Knowledge Gap",
    description: "The bot could not find relevant knowledge to answer confidently.",
    llmHint: "Automatic when retrieval confidence is low and no knowledge chunks match.",
    category: "quality",
  },
  {
    type: BUILTIN_EVENT_TYPES.TEST_PING,
    name: "Test Ping",
    description: "Manual test event from the Integrations dashboard.",
    llmHint: "System-only test event; never emitted from live chat.",
    category: "system",
  },
];

export function getEventCatalogEntry(type: string): EventCatalogEntry | undefined {
  return EVENT_CATALOG.find((e) => e.type === type);
}

export function resolveEventMeta(
  type: string,
  custom?: { name?: string; description?: string },
): { name: string; description: string } {
  const builtin = getEventCatalogEntry(type);
  if (builtin) {
    return { name: builtin.name, description: builtin.description };
  }
  const slug = type.replace(/^custom\./, "").replace(/[._-]/g, " ");
  return {
    name: custom?.name ?? slug.replace(/\b\w/g, (c) => c.toUpperCase()),
    description: custom?.description ?? `Custom event: ${type}`,
  };
}
