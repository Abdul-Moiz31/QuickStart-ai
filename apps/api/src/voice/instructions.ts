import { GEMINI_VOICE_NAMES } from "@quickstart-ai/shared";

export interface VoiceProjectConfig {
  name: string;
  description: string;
  welcomeMessage: string;
  systemPrompt: string;
  voiceName: string | null;
  voiceInstructionsExtra: string | null;
  toolsHumanHandoff: boolean;
  toolsLeadCapture: boolean;
  voiceModel?: string | null;
}

const BASE_VOICE_RULES = `You are a helpful voice assistant for the business described below.
Answer using the search_knowledge tool when you need facts from the company's docs.
If you don't know something after searching, say so honestly — never invent policies or prices.
Keep replies concise and conversational — this is a spoken conversation, not an essay.
When the visitor asks for a human, call escalate_to_human.
When they want a demo, callback, or pricing follow-up, call capture_lead.
If the chat already has messages, do not repeat the welcome greeting — continue the conversation naturally.`;

export function normalizeGeminiModel(model: string): string {
  let trimmed = model.trim();
  if (!trimmed) trimmed = "gemini-2.5-flash-native-audio-latest";
  const withPrefix = trimmed.startsWith("models/") ? trimmed : `models/${trimmed}`;
  // Bare "native-audio" is not a Live API model — map legacy defaults to -latest.
  if (withPrefix === "models/gemini-2.5-flash-native-audio") {
    return "models/gemini-2.5-flash-native-audio-latest";
  }
  return withPrefix;
}

export function normalizeVoiceName(name: string | null | undefined): string {
  const trimmed = (name ?? "Puck").trim();
  if ((GEMINI_VOICE_NAMES as readonly string[]).includes(trimmed)) return trimmed;
  return "Puck";
}

export function buildVoiceSystemInstruction(project: VoiceProjectConfig): string {
  const parts: string[] = [BASE_VOICE_RULES, "", `Business / project name: ${project.name}`];

  if (project.description?.trim()) {
    parts.push(`About: ${project.description.trim()}`);
  }
  if (project.welcomeMessage?.trim()) {
    parts.push(`Greeting style hint: ${project.welcomeMessage.trim()}`);
  }
  if (project.systemPrompt?.trim()) {
    parts.push("", "Additional instructions from the business:", project.systemPrompt.trim());
  }
  if (project.voiceInstructionsExtra?.trim()) {
    parts.push("", project.voiceInstructionsExtra.trim());
  }

  return parts.join("\n");
}

export function buildGeminiToolDeclarations(project: VoiceProjectConfig) {
  const tools: Array<{ name: string; description: string; parameters: object }> = [
    {
      name: "search_knowledge",
      description:
        "Search the business knowledge base for FAQs, policies, pricing, and product details. Call this before answering factual questions.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "What to look up in the knowledge base" },
        },
        required: ["query"],
      },
    },
  ];

  if (project.toolsHumanHandoff !== false) {
    tools.push({
      name: "escalate_to_human",
      description: "Connect the visitor with a human support agent when they ask or when you cannot help.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Why human help is needed" },
        },
        required: ["reason"],
      },
    });
  }

  if (project.toolsLeadCapture) {
    tools.push({
      name: "capture_lead",
      description: "Record visitor contact details when they want pricing, a demo, or a callback.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          note: { type: "string" },
        },
        required: ["name", "email"],
      },
    });
  }

  return tools;
}

export function buildGeminiLiveConnectConfig(project: VoiceProjectConfig) {
  const declarations = buildGeminiToolDeclarations(project);
  return {
    responseModalities: ["AUDIO"],
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    thinkingConfig: {
      thinkingBudget: 0,
      includeThoughts: false,
    },
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: normalizeVoiceName(project.voiceName) },
      },
    },
    systemInstruction: {
      parts: [{ text: buildVoiceSystemInstruction(project) }],
    },
    tools: declarations.length ? [{ functionDeclarations: declarations }] : undefined,
    realtimeInputConfig: {
      automaticActivityDetection: {
        disabled: false,
        startOfSpeechSensitivity: "START_SENSITIVITY_HIGH",
        endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
      },
    },
    sessionResumption: {},
    contextWindowCompression: { slidingWindow: {} },
  };
}
