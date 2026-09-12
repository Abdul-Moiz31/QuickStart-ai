import type { ChatClient, EmbeddingsClient, LLMMessage } from "./llm.js";
import { BUILTIN_EVENT_TYPES, HANDOFF_AGENT_GUIDELINES } from "@quickstart-ai/shared";
import { fetchWebsiteSummary } from "./website.js";
import { hybridRetrieve, rerankChunks, type RetrievedChunk } from "./retrieve.js";
import {
  executeCustomTool,
  formatCustomToolDescription,
  type CustomToolRuntime,
} from "./custom-tools.js";
import { runTrueAgentLoop, runTrueAgentStream } from "./agent-loop.js";

export interface ToolEventPayload {
  type: string;
  name?: string;
  description?: string;
  payload: Record<string, unknown>;
}

/** Tappable choices for channels that render them (WhatsApp interactive messages). */
export interface QuickReplyOptions {
  prompt?: string;
  options: Array<{ id: string; title: string }>;
}

export interface ToolExecutionResult {
  output: string;
  event?: ToolEventPayload;
  quickReplies?: QuickReplyOptions;
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
  /**
   * Best raw retrieval score, taken before reranking.
   *
   * `chunks[].score` is overwritten by rerankChunks with an LLM 0-10 judgement
   * divided by 10, so it is not comparable with a vectorSearch cosine. Callers
   * that need to compare retrieval quality against a later search must use this.
   */
  retrievalTopScore: number;
  eventsEmitted: ToolEventPayload[];
  /** Set only when the agent chose to present tappable choices and the channel opted in (WhatsApp). */
  quickReplies?: QuickReplyOptions;
}

export interface BuildAgentToolsContext {
  projectId: string;
  projectName: string;
  businessHours?: string;
  businessWebsite?: string;
  embeddings: EmbeddingsClient;
  chat: ChatClient;
  useHyde?: boolean;
  accumulatedChunks: RetrievedChunk[];
  retrievalTopScoreRef: { value: number };
  toolsWebSearch?: boolean;
  toolsHumanHandoff?: boolean;
  toolsLeadCapture?: boolean;
  /** Only WhatsApp interactive messages render tappable choices — the web widget and SMS don't. */
  toolsInteractiveReplies?: boolean;
  visitorEmail?: string;
  visitorName?: string;
  userMessage?: string;
  customTools?: CustomToolRuntime[];
  redisUrl?: string;
}

function mergeUniqueChunks(target: RetrievedChunk[], incoming: RetrievedChunk[]): void {
  const seen = new Set(target.map((c) => c.id));
  for (const chunk of incoming) {
    if (!seen.has(chunk.id)) {
      seen.add(chunk.id);
      target.push(chunk);
    }
  }
}

export function buildAgentTools(ctx: BuildAgentToolsContext): AgentTool[] {
  const tools: AgentTool[] = [
    {
      name: "search_knowledge",
      description:
        "Search the business knowledge base (policies, products, FAQs, docs). Pass args.query with a focused search string. Call multiple times with different queries when needed.",
      async execute(args) {
        const query = String(args.query ?? ctx.userMessage ?? "").trim();
        if (!query) return { output: "Error: provide args.query with what to search for." };

        const { chunks: raw } = await hybridRetrieve({
          projectId: ctx.projectId,
          query,
          embeddings: ctx.embeddings,
          chat: ctx.chat,
          useHyde: ctx.useHyde ?? true,
          topK: 20,
        });
        const topRaw = raw.length ? Math.max(...raw.map((c) => c.score)) : 0;
        ctx.retrievalTopScoreRef.value = Math.max(ctx.retrievalTopScoreRef.value, topRaw);
        const reranked = await rerankChunks(query, raw, ctx.chat, 8);
        mergeUniqueChunks(ctx.accumulatedChunks, reranked);

        if (!reranked.length) {
          return { output: "No knowledge snippets found for that query." };
        }
        return {
          output: reranked
            .map((c, i) => `[${i + 1}] (score=${c.score.toFixed(3)}) ${c.content}`)
            .join("\n\n"),
        };
      },
    },
    {
      name: "get_project_faq",
      description: "Return FAQ-style snippets from knowledge gathered so far in this turn",
      async execute() {
        const faqs = ctx.accumulatedChunks.filter((c) => /q:|question|faq/i.test(c.content));
        const content = (faqs.length ? faqs : ctx.accumulatedChunks)
          .slice(0, 5)
          .map((c) => c.content)
          .join("\n---\n");
        return { output: content || "No FAQ snippets yet — try search_knowledge first." };
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

if (ctx.toolsInteractiveReplies) {
    tools.push({
      name: "present_options",
      description:
        "Offer the visitor a short list of tappable choices (2-10) instead of free text, when the answer naturally narrows to a few options — e.g. picking a product, a support topic, or yes/no. Args: options (string array), prompt (optional short label).",
      async execute(args) {
        const rawOptions = Array.isArray(args.options) ? args.options : [];
        const options = rawOptions
          .slice(0, 10)
          .map((o, i) => ({ id: `opt_${i + 1}`, title: String(o).slice(0, 24) }))
          .filter((o) => o.title.trim().length > 0);
        if (!options.length) return { output: "No options provided." };
        return {
          output: `Presented options: ${options.map((o) => o.title).join(", ")}`,
          quickReplies: { prompt: args.prompt ? String(args.prompt) : undefined, options },
        };
      },
    });
  }

  for (const custom of ctx.customTools ?? []) {
    if (!custom.enabled) continue;
    tools.push({
      name: custom.name,
      description: formatCustomToolDescription(custom),
      async execute(args) {
        const { query: _query, ...toolArgs } = args;
        const result = await executeCustomTool(custom, toolArgs, {
          projectId: ctx.projectId,
          redisUrl: ctx.redisUrl,
        });
        return { output: result.output };
      },
    });
  }

  return tools;
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
  return `${base}\n\n${WIDGET_REPLY_GUIDELINES}\n\n${HANDOFF_AGENT_GUIDELINES}`;
}

function buildTrueAgentContext(opts: {
  projectId: string;
  projectName: string;
  businessHours?: string;
  businessWebsite?: string;
  embeddings: EmbeddingsClient;
  chat: ChatClient;
  useHyde?: boolean;
  toolsWebSearch?: boolean;
  toolsHumanHandoff?: boolean;
  toolsLeadCapture?: boolean;
  toolsInteractiveReplies?: boolean;
  visitorName?: string;
  visitorEmail?: string;
  userMessage?: string;
  customTools?: CustomToolRuntime[];
  redisUrl?: string;
}) {
  const accumulatedChunks: RetrievedChunk[] = [];
  const retrievalTopScoreRef = { value: 0 };
  const tools = buildAgentTools({
    projectId: opts.projectId,
    projectName: opts.projectName,
    businessHours: opts.businessHours,
    businessWebsite: opts.businessWebsite,
    embeddings: opts.embeddings,
    chat: opts.chat,
    useHyde: opts.useHyde,
    accumulatedChunks,
    retrievalTopScoreRef,
    toolsWebSearch: opts.toolsWebSearch,
    toolsHumanHandoff: opts.toolsHumanHandoff,
    toolsLeadCapture: opts.toolsLeadCapture,
    toolsInteractiveReplies: opts.toolsInteractiveReplies,
    visitorName: opts.visitorName,
    visitorEmail: opts.visitorEmail,
    userMessage: opts.userMessage,
    customTools: opts.customTools,
    redisUrl: opts.redisUrl,
  });
  return { accumulatedChunks, retrievalTopScoreRef, tools };
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
  toolsInteractiveReplies?: boolean;
  visitorName?: string;
  visitorEmail?: string;
  customTools?: CustomToolRuntime[];
  redisUrl?: string;
}): Promise<AgentResult> {
  const { accumulatedChunks, retrievalTopScoreRef, tools } = buildTrueAgentContext({
    ...opts,
    userMessage: opts.query,
  });
  const system = buildAgentSystemPrompt(opts.projectName, opts.systemPrompt);

  const result = await runTrueAgentLoop({
    systemPrompt: system,
    query: opts.query,
    history: opts.history,
    chat: opts.chat,
    tools,
    modelChainRotate: opts.modelChainRotate,
    accumulatedChunks,
    retrievalTopScoreRef,
  });

  return {
    answer: result.answer,
    chunks: result.chunks,
    toolsUsed: result.toolsUsed,
    confidence: result.confidence,
    retrievalTopScore: result.retrievalTopScore,
    eventsEmitted: result.eventsEmitted,
    quickReplies: result.quickReplies,
  };
}

export interface AgentStreamPreamble {
  chunks: RetrievedChunk[];
  toolsUsed: string[];
  confidence: AgentResult["confidence"];
  /** See AgentResult.retrievalTopScore. */
  retrievalTopScore: number;
  eventsEmitted: ToolEventPayload[];
  /** Messages for the final answer step — used to retry when streaming yields nothing. */
  answerMessages: LLMMessage[];
}

type AgentRagOpts = Parameters<typeof runAgenticRag>[0];

/**
 * Streaming variant — yields speak steps immediately, runs tools between steps,
 * then streams the final answer.
 */
export async function* runAgenticRagStream(
  opts: AgentRagOpts,
): AsyncGenerator<string, AgentStreamPreamble, undefined> {
  const { accumulatedChunks, retrievalTopScoreRef, tools } = buildTrueAgentContext({
    ...opts,
    userMessage: opts.query,
  });
  const system = buildAgentSystemPrompt(opts.projectName, opts.systemPrompt);

  const gen = runTrueAgentStream({
    systemPrompt: system,
    query: opts.query,
    history: opts.history,
    chat: opts.chat,
    tools,
    modelChainRotate: opts.modelChainRotate,
    accumulatedChunks,
    retrievalTopScoreRef,
  });

  let next = await gen.next();
  while (!next.done) {
    yield next.value;
    next = await gen.next();
  }

  const result = next.value;
  return {
    chunks: result.chunks,
    toolsUsed: result.toolsUsed,
    confidence: result.confidence,
    retrievalTopScore: result.retrievalTopScore,
    eventsEmitted: result.eventsEmitted,
    answerMessages: result.answerMessages,
  };
}
