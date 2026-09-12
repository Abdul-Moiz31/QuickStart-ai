import type { ChatClient, LLMMessage } from "./llm.js";
import { looksLikeGibberish } from "@quickstart-ai/shared";
import type { RetrievedChunk } from "./retrieve.js";
import type { AgentTool, QuickReplyOptions, ToolEventPayload } from "./agent.js";

export const AGENT_MAX_ITERATIONS = 10;
export const AGENT_MAX_TOOL_CALLS = 15;

export type AgentStep =
  | { step: "speak"; text: string }
  | { step: "tool"; name: string; args: Record<string, unknown> }
  | { step: "answer"; text?: string };

export function parseAgentStep(raw: string): AgentStep | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const step = String(parsed.step ?? "").toLowerCase();
    if (step === "speak") {
      const text = String(parsed.text ?? "").trim();
      if (!text) return null;
      return { step: "speak", text };
    }
    if (step === "tool") {
      const name = String(parsed.name ?? "").trim();
      if (!name) return null;
      const args =
        parsed.args && typeof parsed.args === "object" && !Array.isArray(parsed.args)
          ? (parsed.args as Record<string, unknown>)
          : {};
      return { step: "tool", name, args };
    }
    if (step === "answer") {
      const text = String(parsed.text ?? "").trim();
      return { step: "answer", text: text || undefined };
    }
    return null;
  } catch {
    return null;
  }
}

export const AGENT_BEHAVIOR_GUIDELINES = [
  "You are an agent that works in small steps. Each model turn must be exactly ONE JSON object — no markdown, no prose outside JSON.",
  "",
  'Speak (optional, repeatable): {"step":"speak","text":"One moment — let me check that in our system."}',
  'Tool (repeatable): {"step":"tool","name":"tool_name","args":{...}}',
  'Final answer: {"step":"answer","text":"Your complete reply to the visitor."}',
  "",
  "Behavior:",
  "- Before search_knowledge, custom tools, or web_search, usually send a short speak step first so the visitor knows you are working.",
  "- Call search_knowledge with a focused query. You may call it multiple times with different queries.",
  "- Call custom HTTP tools whenever they help; you may call the same or different tools multiple times.",
  "- When you have enough information, send step answer with the full widget-sized reply.",
  "- Use escalate_to_human when the visitor asks for a person or you cannot help after searching.",
  "- Do not call escalate_to_human for gibberish.",
  "- Never invent policies, prices, or contact details — use tool results only.",
  "- Never claim you notified the team unless escalate_to_human was called successfully.",
].join("\n");

function buildAgentCatalog(tools: AgentTool[]): string {
  return tools.map((t) => `- ${t.name}: ${t.description}`).join("\n");
}

function gibberishAnswerNote(query: string): string | null {
  if (!looksLikeGibberish(query)) return null;
  return [
    "The visitor message looks unclear or nonsensical.",
    "Use step answer to ask them to rephrase.",
    "Do NOT call escalate_to_human for gibberish.",
  ].join(" ");
}

function buildLoopSystemPrompt(
  systemPrompt: string,
  tools: AgentTool[],
  query: string,
): string {
  return [
    systemPrompt,
    AGENT_BEHAVIOR_GUIDELINES,
    gibberishAnswerNote(query),
    `Available tools:\n${buildAgentCatalog(tools)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function computeConfidence(chunks: RetrievedChunk[]): "high" | "medium" | "low" {
  const avgScore =
    chunks.length > 0 ? chunks.reduce((s, c) => s + c.score, 0) / chunks.length : 0;
  return avgScore >= 0.55 ? "high" : avgScore >= 0.3 ? "medium" : "low";
}

function* yieldTextChunks(text: string): Generator<string> {
  const parts = text.match(/\S+\s*|\s+/g) ?? [text];
  for (const part of parts) yield part;
}

function appendLoopTurn(
  loopMessages: LLMMessage[],
  stepJson: string,
  toolName?: string,
  toolOutput?: string,
): void {
  loopMessages.push({ role: "assistant", content: stepJson });
  if (toolName && toolOutput !== undefined) {
    loopMessages.push({ role: "tool", content: toolOutput, name: toolName });
  }
}

async function synthesizeFinalAnswer(opts: {
  chat: ChatClient;
  systemPrompt: string;
  query: string;
  history: LLMMessage[];
  loopMessages: LLMMessage[];
  modelChainRotate?: number;
}): Promise<string> {
  const messages: LLMMessage[] = [
    {
      role: "system",
      content: [
        opts.systemPrompt,
        "Write the final visitor-facing answer using ONLY the tool results in this turn.",
        "Keep it concise (widget-sized). Do not mention JSON or internal steps.",
      ].join("\n\n"),
    },
    ...opts.history.slice(-8),
    { role: "user", content: opts.query },
    ...opts.loopMessages,
    {
      role: "user",
      content: "Provide the final answer to the visitor now. Plain text only — no JSON.",
    },
  ];
  return opts.chat.chat(messages, {
    temperature: 0.2,
    maxTokens: 400,
    modelChainRotate: opts.modelChainRotate,
  });
}

export interface TrueAgentLoopOpts {
  systemPrompt: string;
  query: string;
  history: LLMMessage[];
  chat: ChatClient;
  tools: AgentTool[];
  modelChainRotate?: number;
  accumulatedChunks: RetrievedChunk[];
  retrievalTopScoreRef: { value: number };
}

export interface TrueAgentLoopResult {
  answer: string;
  chunks: RetrievedChunk[];
  toolsUsed: string[];
  confidence: "high" | "medium" | "low";
  retrievalTopScore: number;
  eventsEmitted: ToolEventPayload[];
  quickReplies?: QuickReplyOptions;
  answerMessages: LLMMessage[];
}

async function runAgentStep(opts: {
  chat: ChatClient;
  loopSystemPrompt: string;
  query: string;
  history: LLMMessage[];
  loopMessages: LLMMessage[];
  modelChainRotate?: number;
  forceAnswer?: boolean;
}): Promise<AgentStep | null> {
  const messages: LLMMessage[] = [
    {
      role: "system",
      content: opts.forceAnswer
        ? [
            opts.loopSystemPrompt,
            "You have reached the step limit. Respond with step answer only — include the full visitor reply in text.",
          ].join("\n\n")
        : opts.loopSystemPrompt,
    },
    ...opts.history.slice(-6),
    { role: "user", content: opts.query },
    ...opts.loopMessages,
  ];

  const raw = await opts.chat.chat(messages, {
    temperature: 0.1,
    maxTokens: opts.forceAnswer ? 500 : 350,
    modelChainRotate: opts.modelChainRotate,
    textOnly: true,
  });
  return parseAgentStep(raw);
}

async function executeAgentTool(
  tool: AgentTool,
  args: Record<string, unknown>,
  query: string,
): Promise<{ output: string; event?: ToolEventPayload; quickReplies?: QuickReplyOptions }> {
  const result = await tool.execute({ query, ...args });
  return {
    output: result.output,
    event: result.event,
    quickReplies: result.quickReplies,
  };
}

export async function* runTrueAgentStream(
  opts: TrueAgentLoopOpts,
): AsyncGenerator<string, TrueAgentLoopResult, undefined> {
  const loopSystemPrompt = buildLoopSystemPrompt(opts.systemPrompt, opts.tools, opts.query);
  const loopMessages: LLMMessage[] = [];
  const toolsUsed: string[] = [];
  const eventsEmitted: ToolEventPayload[] = [];
  let quickReplies: QuickReplyOptions | undefined;
  const speakParts: string[] = [];
  let toolCallCount = 0;
  let finalAnswer: string | undefined;

  for (let i = 0; i < AGENT_MAX_ITERATIONS; i++) {
    const forceAnswer = i === AGENT_MAX_ITERATIONS - 1;
    const step = await runAgentStep({
      chat: opts.chat,
      loopSystemPrompt,
      query: opts.query,
      history: opts.history,
      loopMessages,
      modelChainRotate: opts.modelChainRotate,
      forceAnswer,
    });

    if (!step) {
      if (forceAnswer) break;
      continue;
    }

    if (step.step === "speak") {
      speakParts.push(step.text);
      appendLoopTurn(loopMessages, JSON.stringify(step));
      for (const chunk of yieldTextChunks(step.text)) yield chunk;
      continue;
    }

    if (step.step === "tool") {
      if (toolCallCount >= AGENT_MAX_TOOL_CALLS) {
        appendLoopTurn(
          loopMessages,
          JSON.stringify(step),
          step.name,
          "Tool limit reached for this turn. Answer with what you have.",
        );
        continue;
      }

      const tool = opts.tools.find((t) => t.name === step.name);
      if (!tool) {
        appendLoopTurn(
          loopMessages,
          JSON.stringify(step),
          step.name,
          `Unknown tool: ${step.name}`,
        );
        continue;
      }

      toolCallCount += 1;
      toolsUsed.push(step.name);
      const { output, event, quickReplies: qr } = await executeAgentTool(
        tool,
        step.args,
        opts.query,
      );
      if (event) eventsEmitted.push(event);
      if (qr) quickReplies = qr;
      appendLoopTurn(loopMessages, JSON.stringify(step), step.name, output);
      continue;
    }

    if (step.step === "answer") {
      finalAnswer = step.text;
      break;
    }
  }

  if (!finalAnswer?.trim()) {
    if (opts.chat.chatStream) {
      let synthesized = "";
      for await (const token of opts.chat.chatStream(
        [
          {
            role: "system",
            content: [
              opts.systemPrompt,
              "Write the final visitor-facing answer using ONLY the tool results in this turn.",
              "Keep it concise (widget-sized).",
            ].join("\n\n"),
          },
          ...opts.history.slice(-8),
          { role: "user", content: opts.query },
          ...loopMessages,
          {
            role: "user",
            content: "Provide the final answer to the visitor now. Plain text only.",
          },
        ],
        { temperature: 0.2, maxTokens: 400, modelChainRotate: opts.modelChainRotate },
      )) {
        synthesized += token;
        yield token;
      }
      finalAnswer = synthesized;
    } else {
      finalAnswer = await synthesizeFinalAnswer({
        chat: opts.chat,
        systemPrompt: opts.systemPrompt,
        query: opts.query,
        history: opts.history,
        loopMessages,
        modelChainRotate: opts.modelChainRotate,
      });
      for (const chunk of yieldTextChunks(finalAnswer)) yield chunk;
    }
  } else {
    if (speakParts.length > 0) yield "\n\n";
    for (const chunk of yieldTextChunks(finalAnswer)) yield chunk;
  }

  const answer = [...speakParts, finalAnswer.trim()].filter(Boolean).join("\n\n");
  const answerMessages: LLMMessage[] = [
    {
      role: "system",
      content: [
        opts.systemPrompt,
        "Tool trace:",
        ...loopMessages.map((m) => `${m.role}: ${m.content}`),
      ].join("\n"),
    },
    ...opts.history.slice(-8),
    { role: "user", content: opts.query },
  ];

  return {
    answer,
    chunks: opts.accumulatedChunks,
    toolsUsed,
    confidence: computeConfidence(opts.accumulatedChunks),
    retrievalTopScore: opts.retrievalTopScoreRef.value,
    eventsEmitted,
    quickReplies,
    answerMessages,
  };
}

export async function runTrueAgentLoop(opts: TrueAgentLoopOpts): Promise<TrueAgentLoopResult> {
  const gen = runTrueAgentStream(opts);
  let next = await gen.next();
  while (!next.done) {
    next = await gen.next();
  }
  return next.value;
}
