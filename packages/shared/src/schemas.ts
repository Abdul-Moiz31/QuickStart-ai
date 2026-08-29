import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  category: z.string().max(120).optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  allowedOrigins: z.array(z.string().url()).optional(),
  widgetTheme: z.enum(["primary", "secondary", "tech", "professional"]).optional(),
  widgetPosition: z.enum(["left", "right"]).optional(),
  systemPrompt: z.string().max(8000).optional(),
  primaryColor: z.string().max(32).optional(),
  welcomeMessage: z.string().max(500).optional(),
  toolsWebSearch: z.boolean().optional(),
  toolsHumanHandoff: z.boolean().optional(),
  toolsLeadCapture: z.boolean().optional(),
  sessionReviewEnabled: z.boolean().optional(),
});

export const updateLlmSettingsSchema = z.object({
  llmProvider: z.enum(["platform", "openrouter", "openai", "google", "anthropic", "xai", "groq"]),
  useOwnLlmKey: z.boolean(),
  /** Preset model id from provider catalog */
  llmModel: z.string().max(120).optional(),
  /** New key — omitted keeps existing; empty string clears stored key */
  llmApiKey: z.string().max(512).optional(),
});

export const updateKnowledgeDocSchema = z.object({
  title: z.string().min(1).max(240).optional(),
  content: z.string().min(1).max(500_000).optional(),
});

export const updateKnowledgeQaSchema = z.object({
  qaIndex: z.number().int().min(0),
  question: z.string().min(1).max(2000),
  answer: z.string().min(1).max(20_000),
});

export const deleteKnowledgeQaSchema = z.object({
  qaIndex: z.number().int().min(0),
});

export const onboardingBusinessSchema = z.object({
  businessName: z.string().min(1).max(160),
  businessWebsite: z
    .string()
    .max(300)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .pipe(z.string().url().optional()),
  businessIndustry: z.string().min(1).max(120),
  businessDescription: z.string().min(20).max(4000),
  businessLocation: z.string().max(160).optional(),
  supportEmail: z
    .string()
    .max(160)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .pipe(z.string().email().optional()),
});

/** Partial business profile update (MCP / external integrations). */
export const updateBusinessProfileSchema = onboardingBusinessSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one business field is required" },
);

export const onboardingCompleteSchema = z.object({
  businessName: z.string().min(1).max(160),
  businessWebsite: z.string().max(300).optional(),
  businessIndustry: z.string().min(1).max(120),
  businessDescription: z.string().min(20).max(4000),
  businessLocation: z.string().max(160).optional(),
  supportEmail: z.string().max(160).optional(),
  questions: z.array(z.string().min(1)).min(1).max(20),
  answers: z.array(z.string().min(1)).min(1).max(20),
  projectName: z.string().min(1).max(120),
  projectDescription: z.string().max(2000).optional(),
});

export const ingestTextSchema = z.object({
  title: z.string().min(1).max(240),
  content: z.string().min(1).max(500_000),
  sourceType: z.enum(["text", "faq", "url", "file"]).default("text"),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().optional(),
  visitorName: z.string().max(120).optional(),
  visitorEmail: z.string().email().optional(),
  stream: z.boolean().optional().default(true),
});

export const createSessionSchema = z.object({
  visitorName: z.string().min(1).max(120),
  visitorEmail: z.string().email(),
});

export const createWebhookSchema = z.object({
  label: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(""),
  url: z.string().url().max(2000),
  events: z.array(z.string().min(1).max(120)).min(1).max(50),
  enabled: z.boolean().optional().default(true),
});

export const updateWebhookSchema = createWebhookSchema.partial();

export const createSlackIntegrationSchema = z.object({
  label: z.string().min(1).max(120).optional().default("Slack"),
  description: z.string().max(500).optional().default(""),
  webhookUrl: z.string().url().max(2000),
  events: z.array(z.string().min(1).max(120)).min(1).max(50),
  enabled: z.boolean().optional().default(true),
});

export const createDiscordIntegrationSchema = z.object({
  label: z.string().min(1).max(120).optional().default("Discord"),
  description: z.string().max(500).optional().default(""),
  webhookUrl: z.string().url().max(2000),
  events: z.array(z.string().min(1).max(120)).min(1).max(50),
  enabled: z.boolean().optional().default(true),
});

export const updateIntegrationSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  events: z.array(z.string().min(1).max(120)).min(1).max(50).optional(),
  enabled: z.boolean().optional(),
});

export const eventRuleTriggerSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("keyword"),
    keywords: z.array(z.string().min(1).max(80)).min(1).max(20),
  }),
  z.object({
    type: z.literal("regex"),
    pattern: z.string().min(1).max(200),
  }),
  z.object({
    type: z.literal("tool"),
    toolName: z.string().min(1).max(80),
  }),
  z.object({
    type: z.literal("confidence"),
    maxConfidence: z.enum(["low", "medium"]),
  }),
  z.object({
    type: z.literal("intent"),
    intents: z.array(z.string().min(1).max(80)).min(1).max(10),
  }),
]);

export const eventRuleDestinationSchema = z.object({
  kind: z.enum(["webhook", "integration"]),
  id: z.string().uuid(),
});

export const createEventRuleSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(""),
  eventType: z
    .string()
    .min(1)
    .max(120)
    .regex(/^custom\.[a-z0-9_]+$/, "Event type must start with custom. and use lowercase letters, numbers, underscores"),
  enabled: z.boolean().optional().default(true),
  triggers: eventRuleTriggerSchema,
  destinations: z.array(eventRuleDestinationSchema).max(20),
});

export const updateEventRuleSchema = createEventRuleSchema.partial();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
