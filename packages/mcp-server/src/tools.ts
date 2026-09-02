import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpServer as McpServerImpl } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  classifyKnowledgeDoc,
  mcpToolGroup,
  mcpToolMeta,
  parseKnowledgeQa,
} from "@quickstart-ai/shared";
import { QuickStartApiError, type QuickStartApiClient } from "./api-client.js";

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Tool descriptions are built from the shared catalog so the summary a client
 * shows and the one the docs page shows can never disagree.
 */
function describeTool(name: string, detail?: string): string {
  const { summary } = mcpToolMeta(name);
  const { label } = mcpToolGroup(name);
  return [`${label} — ${summary}`, detail].filter(Boolean).join(" ");
}

function describeFailure(toolName: string, err: unknown): string {
  if (err instanceof QuickStartApiError) {
    if (err.status === 401) {
      return "Your QuickStart AI access token is invalid or expired. Reconnect the MCP server.";
    }
    if (err.status === 403) {
      const role = mcpToolMeta(toolName).minRole ?? "admin";
      return `${toolName} needs the ${role} role on that project.`;
    }
    if (err.status === 404) return `Not found: ${err.message}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/** Keeps raw HTTP errors out of the assistant's context. */
async function guarded(toolName: string, fn: () => Promise<unknown>) {
  try {
    return textResult(await fn());
  } catch (err) {
    return textResult({ error: describeFailure(toolName, err) });
  }
}

const projectIdArg = z
  .string()
  .uuid()
  .optional()
  .describe("Project ID; defaults to your primary project");

const periodArg = z
  .enum(["7d", "30d", "90d"])
  .optional()
  .describe("Time window (default 30d)");

const INGEST_DELAY_NOTE =
  "Changes are searchable once the worker re-indexes them (~30s).";

function registerWorkspaceTools(server: McpServer, getClient: () => QuickStartApiClient) {
  server.tool(
    "list_projects",
    describeTool("list_projects", "Use this to find a projectId for the other tools."),
    {},
    async () =>
      guarded("list_projects", async () => {
        const res = await getClient().listProjects();
        return { projects: res.projects };
      }),
  );

  server.tool(
    "get_project_status",
    describeTool("get_project_status"),
    { projectId: projectIdArg },
    async ({ projectId }) =>
      guarded("get_project_status", async () => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.getProject(pid);
        const p = res.project;
        // Only safe fields: this endpoint also returns widget credentials and
        // BYOK LLM settings for owners, which must never leave the dashboard.
        return {
          projectId: p.id,
          name: p.name,
          description: p.description,
          chatbotLive: p.chatbotEnabled,
          plan: p.plan,
          credits: p.credits ?? null,
          yourRole: p.memberRole,
          // The API withholds documents from agents, so 0 would be misleading.
          knowledgeDocuments: p.memberRole === "agent" ? null : res.documents.length,
          reviewPassedAt: p.evalPassedAt,
        };
      }),
  );
}

function registerProfileTools(server: McpServer, getClient: () => QuickStartApiClient) {
  server.tool(
    "get_business_profile",
    describeTool("get_business_profile"),
    {},
    async () =>
      guarded("get_business_profile", async () => {
        const res = await getClient().getBusinessProfile();
        const o = res.onboarding;
        return {
          onboardingCompleted: o.onboardingCompleted,
          businessName: o.businessName,
          businessWebsite: o.businessWebsite,
          businessIndustry: o.businessIndustry,
          businessDescription: o.businessDescription,
          businessLocation: o.businessLocation ?? null,
          supportEmail: o.supportEmail ?? null,
          onboardingQuestions: o.onboardingQuestions,
          onboardingAnswers: o.onboardingAnswers,
          defaultProjectId: o.defaultProjectId,
          defaultProjectName: o.defaultProjectName,
        };
      }),
  );

  server.tool(
    "update_business_profile",
    describeTool(
      "update_business_profile",
      "Provide any fields to change; omitted fields stay as-is.",
    ),
    {
      businessName: z.string().min(1).max(160).optional(),
      businessWebsite: z.string().url().max(300).optional(),
      businessIndustry: z.string().min(1).max(120).optional(),
      businessDescription: z.string().min(20).max(4000).optional(),
      businessLocation: z.string().max(160).optional(),
      supportEmail: z.string().email().max(160).optional(),
    },
    async (args) =>
      guarded("update_business_profile", async () => {
        const body = Object.fromEntries(
          Object.entries(args).filter(([, v]) => v !== undefined && v !== ""),
        );
        if (Object.keys(body).length === 0) {
          return { error: "Provide at least one business field to save." };
        }
        const res = await getClient().updateBusinessProfile(body);
        return res.business;
      }),
  );
}

function registerKnowledgeTools(server: McpServer, getClient: () => QuickStartApiClient) {
  server.tool(
    "list_faqs",
    describeTool(
      "list_faqs",
      "Returns documentId and qaIndex for each pair, which update_faq and delete_faq need.",
    ),
    { projectId: projectIdArg },
    async ({ projectId }) =>
      guarded("list_faqs", async () => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.listKnowledge(pid);

        const faqs = res.documents
          .filter((d) => classifyKnowledgeDoc(d) === "faq")
          .flatMap((d) =>
            parseKnowledgeQa(d.rawContent).map((qa, index) => ({
              documentId: d.id,
              documentTitle: d.title,
              qaIndex: index,
              question: qa.question,
              answer: qa.answer,
              status: d.status,
            })),
          );

        const onboarding = res.documents.find((d) => classifyKnowledgeDoc(d) === "onboarding");

        return {
          projectId: pid,
          faqCount: faqs.length,
          faqs,
          onboardingDocument: onboarding
            ? { id: onboarding.id, title: onboarding.title, status: onboarding.status }
            : null,
        };
      }),
  );

  server.tool(
    "add_faq",
    describeTool("add_faq", INGEST_DELAY_NOTE),
    {
      question: z.string().min(1).max(2000),
      answer: z.string().min(1).max(20000),
      title: z
        .string()
        .max(240)
        .optional()
        .describe("Optional document title; defaults to the question"),
      projectId: projectIdArg,
    },
    async ({ question, answer, title, projectId }) =>
      guarded("add_faq", async () => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const docTitle = title?.trim() || question.trim().slice(0, 80);
        const res = await client.addFaq(pid, docTitle, question, answer);
        return {
          projectId: pid,
          documentId: res.document.id,
          title: res.document.title,
          status: res.document.status,
          message: `FAQ queued for ingest. ${INGEST_DELAY_NOTE}`,
        };
      }),
  );

  server.tool(
    "update_faq",
    describeTool(
      "update_faq",
      `Send the full replacement text for both fields. ${INGEST_DELAY_NOTE}`,
    ),
    {
      documentId: z.string().uuid().describe("Document ID from list_faqs"),
      qaIndex: z
        .number()
        .int()
        .min(0)
        .describe("Position of the pair within the document, from list_faqs"),
      question: z.string().min(1).max(2000),
      answer: z.string().min(1).max(20000),
      projectId: projectIdArg,
    },
    async ({ documentId, qaIndex, question, answer, projectId }) =>
      guarded("update_faq", async () => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.updateFaq(pid, documentId, qaIndex, question, answer);
        return {
          projectId: pid,
          documentId: res.document.id,
          status: res.document.status,
          message: `FAQ updated and queued for re-ingest. ${INGEST_DELAY_NOTE}`,
        };
      }),
  );

  server.tool(
    "delete_faq",
    describeTool(
      "delete_faq",
      `Removes one question and answer pair, not the whole document. ${INGEST_DELAY_NOTE}`,
    ),
    {
      documentId: z.string().uuid().describe("Document ID from list_faqs"),
      qaIndex: z
        .number()
        .int()
        .min(0)
        .describe("Position of the pair within the document, from list_faqs"),
      projectId: projectIdArg,
    },
    async ({ documentId, qaIndex, projectId }) =>
      guarded("delete_faq", async () => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.deleteFaq(pid, documentId, qaIndex);
        return {
          projectId: pid,
          documentId: res.document.id,
          status: res.document.status,
          message: `FAQ removed and document queued for re-ingest. ${INGEST_DELAY_NOTE}`,
        };
      }),
  );
}

function registerConversationTools(server: McpServer, getClient: () => QuickStartApiClient) {
  server.tool(
    "list_conversations",
    describeTool("list_conversations"),
    {
      projectId: projectIdArg,
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max conversations to return (default 100)"),
    },
    async ({ projectId, limit }) =>
      guarded("list_conversations", async () => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.listSessions(pid, limit);
        return {
          projectId: pid,
          count: res.sessions.length,
          conversations: res.sessions,
        };
      }),
  );

  server.tool(
    "get_conversation",
    describeTool("get_conversation"),
    {
      sessionId: z
        .string()
        .min(1)
        .describe("Conversation session ID from list_conversations or search_conversations"),
      projectId: projectIdArg,
    },
    async ({ sessionId, projectId }) =>
      guarded("get_conversation", async () => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.getSession(pid, sessionId);
        return { projectId: pid, conversation: res.session };
      }),
  );

  server.tool(
    "search_conversations",
    describeTool("search_conversations"),
    {
      query: z.string().min(1).max(500).describe("Search text (name, email, or message content)"),
      projectId: projectIdArg,
      limit: z.number().int().min(1).max(100).optional().describe("Max results (default 50)"),
    },
    async ({ query, projectId, limit }) =>
      guarded("search_conversations", async () => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.searchSessions(pid, query, limit);
        return {
          projectId: pid,
          query: res.query,
          count: res.sessions.length,
          conversations: res.sessions,
        };
      }),
  );
}

function registerInsightTools(server: McpServer, getClient: () => QuickStartApiClient) {
  server.tool(
    "get_analytics",
    describeTool("get_analytics", "Rates are fractions between 0 and 1."),
    { projectId: projectIdArg, period: periodArg },
    async ({ projectId, period }) =>
      guarded("get_analytics", async () => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.getAnalytics(pid, period);
        // dailyVolume is chart data: one entry per day, useless in a transcript.
        const { dailyVolume: _dailyVolume, ...summary } = res.analytics;
        return { projectId: pid, period: res.period, analytics: summary };
      }),
  );

  server.tool(
    "list_knowledge_gaps",
    describeTool(
      "list_knowledge_gaps",
      "Each gap is a question worth answering with add_faq.",
    ),
    { projectId: projectIdArg, period: periodArg },
    async ({ projectId, period }) =>
      guarded("list_knowledge_gaps", async () => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.listKnowledgeGaps(pid, period);
        return {
          projectId: pid,
          period: res.period,
          analysedAnswers: res.analysedAnswers,
          answeredWellCount: res.resolvedCount,
          gapCount: res.gaps.length,
          gaps: res.gaps,
        };
      }),
  );

  server.tool(
    "get_eval_status",
    describeTool(
      "get_eval_status",
      "A chatbot must pass review before it can serve live visitors.",
    ),
    { projectId: projectIdArg },
    async ({ projectId }) =>
      guarded("get_eval_status", async () => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.getEvalStatus(pid);
        return { projectId: pid, status: res.status };
      }),
  );

  server.tool(
    "list_handoff_requests",
    describeTool(
      "list_handoff_requests",
      "Read-only: replying to a visitor still happens in the dashboard inbox.",
    ),
    { projectId: projectIdArg },
    async ({ projectId }) =>
      guarded("list_handoff_requests", async () => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.listInbox(pid);
        return {
          projectId: pid,
          waitingCount: res.sessions.filter((s) => s.humanPending).length,
          activeCount: res.sessions.filter((s) => s.humanActive).length,
          handoffs: res.sessions,
        };
      }),
  );
}

export function registerQuickStartTools(server: McpServer, getClient: () => QuickStartApiClient) {
  registerWorkspaceTools(server, getClient);
  registerProfileTools(server, getClient);
  registerKnowledgeTools(server, getClient);
  registerConversationTools(server, getClient);
  registerInsightTools(server, getClient);
}

export function createMcpServer(getClient: () => QuickStartApiClient): McpServer {
  const server = new McpServerImpl({ name: "quickstart-ai", version: "0.1.0" });
  registerQuickStartTools(server, getClient);
  return server;
}
