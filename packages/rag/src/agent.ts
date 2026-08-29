import type { ChatClient, EmbeddingsClient, LLMMessage } from "./llm.js";
import { BUILTIN_EVENT_TYPES } from "@quickstart-ai/shared";
import { fetchWebsiteSummary } from "./website.js";
import { hybridRetrieve, rerankChunks, type RetrievedChunk } from "./retrieve.js";

export interface ToolEventPayload {
  type: string;
  name?: string;
  description?: string;
  payload: Record<string, unknown>;
}

export interface ToolExecutionResult {
  output: string;
  event?: ToolEventPayload;
}

export interface AgentTool {
  name: string;
  description: string;
  execute: (args: Record<string, unknown>) => Promise<ToolExecutionResult>;
}

export interface AgentResult {
  answer: string;
  chunks: RetrievedChunk[];
  toolsUsed: string[];
  confidence: "high" | "medium" | "low";
  eventsEmitted: ToolEventPayload[];
}

export function buildAgentTools(ctx: {
  projectId: string;
  projectName: string;
  businessHours?: string;
  businessWebsite?: string;
  chunks: RetrievedChunk[];
  toolsWebSearch?: boolean;
  toolsHumanHandoff?: boolean;
  toolsLeadCapture?: boolean;
  visitorEmail?: string;
  visitorName?: string;
  userMessage?: string;
}): AgentTool[] {
  const tools: AgentTool[] = [
    {
      name: "search_knowledge",
      description: "Return the top retrieved knowledge snippets for the current query",
      async execute() {
        if (!ctx.chunks.length) return { output: "No knowledge snippets found." };
        return {
          output: ctx.chunks
            .map((c, i) => `[${i + 1}] (score=${c.score.toFixed(3)}) ${c.content}`)
            .join("\n\n"),
        };
      },
    },
    {
      name: "get_project_faq",
      description: "Return FAQ-style snippets from retrieved context",
      async execute() {
        const faqs = ctx.chunks.filter((c) => /q:|question|faq/i.test(c.content));
        const content = (faqs.length ? faqs : ctx.chunks)
          .slice(0, 5)
          .map((c) => c.content)
          .join("\n---\n");
        return { output: content };
      },
    },
    {
      name: "get_business_hours",
      description: "Return configured business hours if available",
      async execute() {
        return {
          output:
            ctx.businessHours ?? "Business hours are not configured. Suggest contacting support.",
        };
      },
    },
  ];

  if (ctx.toolsWebSearch) {
    tools.push({
      name: "web_search",
      description:
        "Fetch public web context from the business website when knowledge base is insufficient",
      async execute(args) {
        const query = String(args.query ?? "");
        if (ctx.businessWebsite) {
          const page = await fetchWebsiteSummary(ctx.businessWebsite, { maxChars: 2500 });
          if (page) {
            return {
              output: `Website summary for ${ctx.businessWebsite}:\n${page.slice(0, 2000)}`,
            };
          }
        }
        return {
          output: query
            ? `No live web results available. Query was: ${query}. Suggest checking the business website directly.`
            : "Web search unavailable — no business website configured.",
        };
      },
    });
  }

  if (ctx.toolsHumanHandoff !== false) {
    tools.push({
      name: "escalate_to_human",
      description:
        "Signal that a human agent should follow up when the visitor asks for a person or the bot cannot help",
      async execute(args) {
        const reason = String(args.reason ?? "customer requested human help");
        return {
          output: `Escalation flagged for ${ctx.projectName}: ${reason}`,
          event: {
            type: BUILTIN_EVENT_TYPES.HUMAN_HANDOFF,
            payload: {
              reason,
              message: ctx.userMessage,
              visitor: { name: ctx.visitorName, email: ctx.visitorEmail },
            },
          },
        };
      },
    });
  }

  if (ctx.toolsLeadCapture) {
    tools.push({
      name: "capture_lead",
      description:
        "Record visitor contact details when they want pricing, a demo, or a callback. Requires name and email.",
      async execute(args) {
        const name = String(args.name ?? ctx.visitorName ?? "unknown");
        const email = String(args.email ?? ctx.visitorEmail ?? "unknown");
        const phone = args.phone ? String(args.phone) : undefined;
        return {
          output: `Lead captured for ${ctx.projectName}: ${name} <${email}>`,
          event: {
            type: BUILTIN_EVENT_TYPES.LEAD_CAPTURED,
            payload: {
              name,
              email,
              phone,
              message: ctx.userMessage,
              visitor: { name, email },
            },
          },
        };
      },
    });
  }

  return tools;
}

function computeConfidence(chunks: RetrievedChunk[]): AgentResult["confidence"] {
  const avgScore =
    chunks.length > 0 ? chunks.reduce((s, c) => s + c.score, 0) / chunks.length : 0;
  return avgScore >= 0.55 ? "high" : avgScore >= 0.3 ? "medium" : "low";
}

/** Appended to every agent reply so answers fit the embed widget. */
export const WIDGET_REPLY_GUIDELINES = [
  "Reply format: small chat widget — keep it scannable.",
  "Default length: 2–4 short sentences OR at most 4 bullet points.",
  "Never write essays, long tutorials, or numbered lists longer than 4 items.",
  "No markdown headings (#). Use **bold** only for short labels.",
  "Code: max 3 lines in `backticks`, or point to docs instead of pasting blocks.",
  "Tone: friendly and direct, like texting — not a manual.",
].join("\n");

export function buildAgentSystemPrompt(projectName: string, custom?: string): string {
  const base =
    custom?.trim() ||
    `You are QuickStart AI, a helpful customer support agent for ${projectName}.`;
  return `${base}\n\n${WIDGET_REPLY_GUIDELINES}`;
}

interface ToolLoopPrelude {
  toolsUsed: string[];
  eventsEmitted: ToolEventPayload[];
  answerMessages: LLMMessage[];
}

async function runToolLoopPrelude(opts: {
  tools: AgentTool[];
  chat: ChatClient;
  systemPrompt: string;
  query: string;
  history: LLMMessage[];
  knowledge: string;
  confidence: AgentResult["confidence"];
  modelChainRotate?: number;
}): Promise<ToolLoopPrelude> {
  const toolsUsed: string[] = ["search_knowledge"];
  const eventsEmitted: ToolEventPayload[] = [];
  const toolCatalog = opts.tools
    .map((t) => `- ${t.name}: ${t.description}`)
    .join("\n");

  const plannerMessages: LLMMessage[] = [
    {
      role: "system",
      content: [
        opts.systemPrompt,
        "You may call tools to answer. Reply with JSON only:",
        '{"tools":["tool_name"],"args":{"tool_name":{"key":"value"}},"reason":"brief"}',
        "Pick 0-2 tools besides search_knowledge when helpful.",
        "For capture_lead include name and email in args when known.",
        `Available tools:\n${toolCatalog}`,
        `Retrieval confidence: ${opts.confidence}.`,
        "Knowledge preview:",
        opts.knowledge.slice(0, 3000),
      ].join("\n\n"),
    },
    ...opts.history.slice(-6),
    { role: "user", content: opts.query },
  ];

  let selectedTools: string[] = [];
  let toolArgs: Record<string, Record<string, unknown>> = {};
  try {
    const planRaw = await opts.chat.chat(plannerMessages, {
      temperature: 0,
      maxTokens: 200,
      modelChainRotate: opts.modelChainRotate,
    });
    const match = planRaw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as {
        tools?: string[];
        args?: Record<string, Record<string, unknown>>;
      };
      selectedTools = (parsed.tools ?? []).filter(
        (n) => n !== "search_knowledge" && opts.tools.some((t) => t.name === n),
      );
      toolArgs = parsed.args ?? {};
    }
  } catch {
    selectedTools = [];
  }

  const toolResults: string[] = [`search_knowledge:\n${opts.knowledge}`];
  for (const name of selectedTools.slice(0, 2)) {
    const tool = opts.tools.find((t) => t.name === name);
    if (!tool) continue;
    const args = { query: opts.query, ...toolArgs[name] };
    const result = await tool.execute(args);
    toolResults.push(`${name}:\n${result.output}`);
    toolsUsed.push(name);
    if (result.event) eventsEmitted.push(result.event);
  }

  const answerMessages: LLMMessage[] = [
    {
      role: "system",
      content: [
        opts.systemPrompt,
        "Answer ONLY using the provided knowledge and tool results.",
        "If unsure, say you don't know and offer escalation.",
        "Never invent policies, prices, or contact details.",
        `Retrieval confidence: ${opts.confidence}.`,
        "Tool results:",
        toolResults.join("\n\n---\n\n"),
      ].join("\n\n"),
    },
    ...opts.history.slice(-8),
    { role: "user", content: opts.query },
  ];

  return { toolsUsed, eventsEmitted, answerMessages };
}

async function runToolLoop(opts: {
  tools: AgentTool[];
  chat: ChatClient;
  systemPrompt: string;
  query: string;
  history: LLMMessage[];
  knowledge: string;
  confidence: AgentResult["confidence"];
  modelChainRotate?: number;
}): Promise<{ answer: string; toolsUsed: string[]; eventsEmitted: ToolEventPayload[] }> {
  const { toolsUsed, eventsEmitted, answerMessages } = await runToolLoopPrelude(opts);

  const answer = await opts.chat.chat(answerMessages, {
    temperature: 0.2,
    maxTokens: 400,
    modelChainRotate: opts.modelChainRotate,
  });

  return { answer, toolsUsed, eventsEmitted };
}

export async function runAgenticRag(opts: {
  projectId: string;
  projectName: string;
  systemPrompt?: string;
  query: string;
  history: LLMMessage[];
  embeddings: EmbeddingsClient;
  chat: ChatClient;
  businessHours?: string;
  businessWebsite?: string;
  useHyde?: boolean;
  modelChainRotate?: number;
  toolsWebSearch?: boolean;
  toolsHumanHandoff?: boolean;
  toolsLeadCapture?: boolean;
  visitorName?: string;
  visitorEmail?: string;
}): Promise<AgentResult> {
  const { chunks: rawChunks, method: _method } = await hybridRetrieve({
    projectId: opts.projectId,
    query: opts.query,
    embeddings: opts.embeddings,
    chat: opts.chat,
    useHyde: opts.useHyde ?? true,
    topK: 20,
  });

  const chunks = await rerankChunks(opts.query, rawChunks, opts.chat, 8);

  const tools = buildAgentTools({
    projectId: opts.projectId,
    projectName: opts.projectName,
    businessHours: opts.businessHours,
    businessWebsite: opts.businessWebsite,
    chunks,
    toolsWebSearch: opts.toolsWebSearch,
    toolsHumanHandoff: opts.toolsHumanHandoff,
    toolsLeadCapture: opts.toolsLeadCapture,
    visitorName: opts.visitorName,
    visitorEmail: opts.visitorEmail,
    userMessage: opts.query,
  });

  const knowledgeResult = await tools[0]!.execute({});
  const knowledge = knowledgeResult.output;
  const confidence = computeConfidence(chunks);
  const eventsEmitted: ToolEventPayload[] = [];

  if (confidence === "low" && chunks.length === 0) {
    const escalate = tools.find((t) => t.name === "escalate_to_human");
    if (escalate) {
      const esc = await escalate.execute({ reason: "insufficient knowledge base coverage" });
      if (esc.event) eventsEmitted.push(esc.event);
    }
  }

  const system = buildAgentSystemPrompt(opts.projectName, opts.systemPrompt);

  const { answer, toolsUsed, eventsEmitted: loopEvents } = await runToolLoop({
    tools,
    chat: opts.chat,
    systemPrompt: system,
    query: opts.query,
    history: opts.history,
    knowledge,
    confidence,
    modelChainRotate: opts.modelChainRotate,
  });

  return {
    answer,
    chunks,
    toolsUsed,
    confidence,
    eventsEmitted: [...eventsEmitted, ...loopEvents],
  };
}

export interface AgentStreamPreamble {
  chunks: RetrievedChunk[];
  toolsUsed: string[];
  confidence: AgentResult["confidence"];
  eventsEmitted: ToolEventPayload[];
}

type AgentRagOpts = Parameters<typeof runAgenticRag>[0];

/**
 * Streaming variant of runAgenticRag. Yields real LLM tokens from the final
 * answer step and returns a preamble with metadata on completion. The
 * retrieval + planning phase runs to completion first (cannot be streamed),
 * then the answer generation streams token-by-token.
 */
export async function* runAgenticRagStream(
  opts: AgentRagOpts,
): AsyncGenerator<string, AgentStreamPreamble, undefined> {
  const { chunks: rawChunks } = await hybridRetrieve({
    projectId: opts.projectId,
    query: opts.query,
    embeddings: opts.embeddings,
    chat: opts.chat,
    useHyde: opts.useHyde ?? true,
    topK: 20,
  });

  const chunks = await rerankChunks(opts.query, rawChunks, opts.chat, 8);

  const tools = buildAgentTools({
    projectId: opts.projectId,
    projectName: opts.projectName,
    businessHours: opts.businessHours,
    businessWebsite: opts.businessWebsite,
    chunks,
    toolsWebSearch: opts.toolsWebSearch,
    toolsHumanHandoff: opts.toolsHumanHandoff,
    toolsLeadCapture: opts.toolsLeadCapture,
    visitorName: opts.visitorName,
    visitorEmail: opts.visitorEmail,
    userMessage: opts.query,
  });

  const knowledgeResult = await tools[0]!.execute({});
  const knowledge = knowledgeResult.output;
  const confidence = computeConfidence(chunks);
  const preEventsEmitted: ToolEventPayload[] = [];

  if (confidence === "low" && chunks.length === 0) {
    const escalate = tools.find((t) => t.name === "escalate_to_human");
    if (escalate) {
      const esc = await escalate.execute({ reason: "insufficient knowledge base coverage" });
      if (esc.event) preEventsEmitted.push(esc.event);
    }
  }

  const system = buildAgentSystemPrompt(opts.projectName, opts.systemPrompt);

  const { toolsUsed, eventsEmitted: loopEvents, answerMessages } = await runToolLoopPrelude({
    tools,
    chat: opts.chat,
    systemPrompt: system,
    query: opts.query,
    history: opts.history,
    knowledge,
    confidence,
    modelChainRotate: opts.modelChainRotate,
  });

  // Stream the final answer token-by-token; fall back to completed response if
  // the chat client doesn't support streaming (e.g. stub/test clients).
  if (opts.chat.chatStream) {
    for await (const token of opts.chat.chatStream(answerMessages, {
      temperature: 0.2,
      maxTokens: 400,
      modelChainRotate: opts.modelChainRotate,
    })) {
      yield token;
    }
  } else {
    const answer = await opts.chat.chat(answerMessages, {
      temperature: 0.2,
      maxTokens: 400,
      modelChainRotate: opts.modelChainRotate,
    });
    yield answer;
  }

  return {
    chunks,
    toolsUsed,
    confidence,
    eventsEmitted: [...preEventsEmitted, ...loopEvents],
  };
}
