/**
 * Single source of truth for the MCP server's tool list.
 *
 * The tools themselves live in `@quickstart-ai/mcp-server`, but the names and
 * user-facing summaries are also rendered by the API's MCP metadata route, the
 * public MCP docs page, and the OAuth consent screen. Those three used to keep
 * their own hand-copied copies and drifted apart, so they all read this instead.
 *
 * Deliberately not exposed over MCP: team and invites, outbound webhooks, event
 * rules, channel integrations, custom tools, the admin playground, widget
 * credential rotation, and LLM provider settings. Those are dashboard
 * configuration surfaces, several of them secret-bearing, and an assistant has
 * no reason to drive them. Adding a tool here without a matching registration
 * in the MCP server will advertise something that does not exist.
 */

export type McpToolAccess = "read" | "write";

export type McpToolGroupId =
  | "workspace"
  | "profile"
  | "knowledge"
  | "conversations"
  | "insights";

export interface McpToolMeta {
  name: string;
  /** One line, user-facing. Rendered verbatim in docs and consent screens. */
  summary: string;
  access: McpToolAccess;
  /** Project role the backing API endpoint requires, when it needs one. */
  minRole?: "agent" | "admin";
}

export interface McpToolGroup {
  id: McpToolGroupId;
  label: string;
  /** Doubles as the capability line on the OAuth consent screen. */
  description: string;
  tools: McpToolMeta[];
}

export const MCP_TOOL_GROUPS: readonly McpToolGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    description: "See your projects and whether each chatbot is live",
    tools: [
      {
        name: "list_projects",
        summary: "List your QuickStart AI projects.",
        access: "read",
      },
      {
        name: "get_project_status",
        summary:
          "Check whether a chatbot is live, plus plan, credits, knowledge size, and review status.",
        access: "read",
        minRole: "agent",
      },
    ],
  },
  {
    id: "profile",
    label: "Business profile",
    description: "Read and update your business details",
    tools: [
      {
        name: "get_business_profile",
        summary:
          "Read business name, industry, description, location, support email, and onboarding Q&A.",
        access: "read",
      },
      {
        name: "update_business_profile",
        summary: "Update business details — syncs your chatbot knowledge automatically.",
        access: "write",
      },
    ],
  },
  {
    id: "knowledge",
    label: "Knowledge",
    description: "Read, add, edit, and remove the FAQs your chatbot answers from",
    tools: [
      {
        name: "list_faqs",
        summary: "List the FAQ question and answer pairs the chatbot uses.",
        access: "read",
        minRole: "admin",
      },
      {
        name: "add_faq",
        summary: "Add a new FAQ to the chatbot knowledge base.",
        access: "write",
        minRole: "admin",
      },
      {
        name: "update_faq",
        summary: "Rewrite an existing FAQ question or answer.",
        access: "write",
        minRole: "admin",
      },
      {
        name: "delete_faq",
        summary: "Remove an FAQ from the chatbot knowledge base.",
        access: "write",
        minRole: "admin",
      },
    ],
  },
  {
    id: "conversations",
    label: "Conversations",
    description: "Read visitor chat conversations and search their transcripts",
    tools: [
      {
        name: "list_conversations",
        summary: "List recent visitor chat conversations (excludes admin test sessions).",
        access: "read",
        minRole: "agent",
      },
      {
        name: "get_conversation",
        summary: "Read a full conversation with all of its messages.",
        access: "read",
        minRole: "agent",
      },
      {
        name: "search_conversations",
        summary: "Search conversations by visitor name, email, or message content.",
        access: "read",
        minRole: "agent",
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    description: "Read chatbot performance, knowledge gaps, review status, and open handoffs",
    tools: [
      {
        name: "get_analytics",
        summary:
          "Conversation volume, answer quality, escalation and lead-capture rates for a period.",
        access: "read",
        minRole: "agent",
      },
      {
        name: "list_knowledge_gaps",
        summary: "Questions the chatbot answered badly, grouped and ranked by frequency.",
        access: "read",
        minRole: "admin",
      },
      {
        name: "get_eval_status",
        summary: "Whether the chatbot passed review and is ready for production traffic.",
        access: "read",
        minRole: "admin",
      },
      {
        name: "list_handoff_requests",
        summary: "Conversations waiting on a human agent or currently being handled by one.",
        access: "read",
        minRole: "agent",
      },
    ],
  },
];

export const MCP_TOOL_CATALOG: readonly McpToolMeta[] = MCP_TOOL_GROUPS.flatMap(
  (group) => group.tools,
);

const GROUP_BY_TOOL = new Map<string, McpToolGroup>(
  MCP_TOOL_GROUPS.flatMap((group) => group.tools.map((tool) => [tool.name, group] as const)),
);

/** Throws on unknown names so a typo fails at registration, not at call time. */
export function mcpToolMeta(name: string): McpToolMeta {
  const tool = MCP_TOOL_CATALOG.find((t) => t.name === name);
  if (!tool) throw new Error(`Unknown MCP tool "${name}". Add it to MCP_TOOL_GROUPS first.`);
  return tool;
}

export function mcpToolGroup(name: string): McpToolGroup {
  const group = GROUP_BY_TOOL.get(name);
  if (!group) throw new Error(`Unknown MCP tool "${name}". Add it to MCP_TOOL_GROUPS first.`);
  return group;
}
