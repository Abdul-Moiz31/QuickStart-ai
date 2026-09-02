import { ONBOARDING_MODEL_CHAIN, chatWithModelFallback } from "./llm.js";

export const ONBOARDING_MAX_QUESTIONS = 12;
export const ONBOARDING_WEBSITE_CONTEXT_CHARS = 12_000;

export const ONBOARDING_FALLBACK_QUESTIONS = [
  "What products or services do you offer?",
  "Who is your ideal customer?",
  "What are your business hours and timezone?",
  "What are your most common customer questions?",
  "How does pricing work (plans, trials, billing)?",
  "What is your refund or cancellation policy?",
  "How can customers contact support?",
  "Do you offer demos, onboarding, or setup help?",
  "What integrations or tools do you support?",
  "Are there any limitations or known issues customers should know?",
  "What makes your business different from competitors?",
  "Where should the chatbot send leads or urgent requests?",
];

export interface OnboardingQuestionPair {
  question: string;
  suggestedAnswer: string;
}

export function parseOnboardingQuestionPairs(
  raw: string,
  count: number,
): OnboardingQuestionPair[] | null {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return null;
    const pairs: OnboardingQuestionPair[] = [];
    for (const item of parsed) {
      if (typeof item === "string" && item.trim()) {
        pairs.push({ question: item.trim(), suggestedAnswer: "" });
        continue;
      }
      if (item && typeof item === "object") {
        const row = item as { question?: unknown; suggestedAnswer?: unknown; answer?: unknown };
        const question = typeof row.question === "string" ? row.question.trim() : "";
        const answerRaw =
          typeof row.suggestedAnswer === "string"
            ? row.suggestedAnswer
            : typeof row.answer === "string"
              ? row.answer
              : "";
        if (question) {
          pairs.push({ question, suggestedAnswer: answerRaw.trim() });
        }
      }
    }
    const trimmed = pairs.slice(0, count);
    const minAccepted = Math.min(count, count >= 6 ? 6 : 1);
    return trimmed.length >= minAccepted ? trimmed : null;
  } catch {
    return null;
  }
}

export interface GenerateOnboardingQuestionsParams {
  businessName: string;
  businessIndustry: string;
  businessWebsite?: string;
  businessDescription: string;
  businessLocation?: string;
  supportEmail?: string;
  /** Joined, pre-trimmed website research text, if any. */
  websiteContext?: string;
  /** How many new question+answer pairs to produce. */
  count: number;
  /** Questions already on the form — the model is asked to avoid repeating these. */
  excludeQuestions?: string[];
}

export async function generateOnboardingQuestionPairs(
  params: GenerateOnboardingQuestionsParams,
): Promise<{ pairs: OnboardingQuestionPair[]; model: string | null }> {
  const count = Math.max(1, Math.min(params.count, ONBOARDING_MAX_QUESTIONS));
  const excludeQuestions = (params.excludeQuestions ?? []).filter((q) => q.trim());

  const fallbackPool = ONBOARDING_FALLBACK_QUESTIONS.filter(
    (q) => !excludeQuestions.some((e) => e.trim().toLowerCase() === q.toLowerCase()),
  );
  const fallbackPairs: OnboardingQuestionPair[] = fallbackPool
    .slice(0, count)
    .map((q) => ({ question: q, suggestedAnswer: "" }));

  let pairs: OnboardingQuestionPair[] = fallbackPairs;
  let model: string | null = null;

  try {
    const avoidBlock = excludeQuestions.length
      ? `\n\nDo NOT repeat or closely rephrase any of these existing questions:\n${excludeQuestions.map((q) => `- ${q}`).join("\n")}`
      : "";

    const { content, model: usedModel } = await chatWithModelFallback(
      [
        {
          role: "system",
          content: `You help set up a website support chatbot. Return ONLY a JSON array of exactly ${count} objects:
[{"question": string, "suggestedAnswer": string}, ...]

Rules:
- Each question should be short and specific for a business owner to confirm or edit.
- Each suggestedAnswer must be a concrete draft answer grounded in the website research when possible (pricing, features, contact, policies, hours, etc.).
- If the website does not contain enough info for an answer, write a brief honest placeholder the owner can fill in (e.g. "Contact support@… for pricing details").
- No markdown, no commentary, JSON only.`,
        },
        {
          role: "user",
          content: `Business: ${params.businessName}
Industry: ${params.businessIndustry}
Website: ${params.businessWebsite || "n/a"}
Location: ${params.businessLocation || "n/a"}
Support email: ${params.supportEmail || "n/a"}
Description: ${params.businessDescription}${params.websiteContext ? `\n\nWebsite research (public page content):\n${params.websiteContext}` : ""}

Generate ${count} onboarding question + suggestedAnswer pairs tailored to this business.${avoidBlock}`,
        },
      ],
      ONBOARDING_MODEL_CHAIN,
      { temperature: 0.35, maxTokens: Math.min(3500, 400 * count + 400) },
    );
    const parsed = parseOnboardingQuestionPairs(content, count);
    if (parsed) {
      pairs = parsed;
      model = usedModel;
    }
  } catch (err) {
    console.warn("[onboarding-questions] generation failed, using fallbacks", err);
  }

  return { pairs, model };
}
