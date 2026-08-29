export interface DomainEventInput {
  type: string;
  name?: string;
  description?: string;
  source: "builtin" | "tool" | "heuristic" | "classifier" | "custom" | "test";
  sessionId?: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface ChatEventContext {
  projectId: string;
  sessionId: string;
  visitor: { name: string; email: string };
  userMessage: string;
  assistantAnswer?: string;
  confidence: "high" | "medium" | "low";
  toolsUsed: string[];
  chunkCount: number;
  agentEvents: DomainEventInput[];
  isFirstUserMessage: boolean;
}

export interface EventEnvelope {
  id: string;
  type: string;
  name: string;
  description: string;
  created_at: string;
  project_id: string;
  api_version: string;
  data: Record<string, unknown>;
}

export interface EventRuleTrigger {
  type: "keyword" | "regex" | "tool" | "confidence" | "intent";
  keywords?: string[];
  pattern?: string;
  toolName?: string;
  maxConfidence?: "low" | "medium";
  intents?: string[];
}

export interface EventRuleDestination {
  kind: "webhook" | "integration";
  id: string;
}
