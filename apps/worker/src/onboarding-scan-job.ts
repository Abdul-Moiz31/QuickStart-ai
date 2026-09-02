import { Worker } from "bullmq";
import { prisma } from "@quickstart-ai/db";
import {
  ONBOARDING_MODEL_CHAIN,
  chatWithModelFallback,
  crawlWebsite,
  crawlWebsiteWithOlostep,
} from "@quickstart-ai/rag";
import { QUEUE_NAMES, type OnboardingScanResult } from "@quickstart-ai/shared";
import { processIngest } from "./ingest-job.js";

const MAX_QUESTIONS = 12;
const MAX_SCAN_PAGES = 15;
const WEBSITE_CONTEXT_CHARS = 12_000;

const FALLBACK_QUESTIONS = [
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

export interface OnboardingScanJobData {
  userId: string;
  projectId: string | null;
  businessName: string;
  businessWebsite?: string;
  businessIndustry: string;
  businessDescription: string;
  businessLocation?: string;
  supportEmail?: string;
}

interface QuestionPair {
  question: string;
  suggestedAnswer: string;
}

function parseQuestionPairs(raw: string): QuestionPair[] | null {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return null;
    const pairs: QuestionPair[] = [];
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
    const trimmed = pairs.slice(0, MAX_QUESTIONS);
    return trimmed.length >= 6 ? trimmed : null;
  } catch {
    return null;
  }
}

function parseExtractedFields(raw: string): { location?: string; supportEmail?: string } {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    const parsed = JSON.parse(match[0]) as { location?: unknown; supportEmail?: unknown };
    const location = typeof parsed.location === "string" ? parsed.location.trim() : "";
    const supportEmail = typeof parsed.supportEmail === "string" ? parsed.supportEmail.trim() : "";
    return {
      location: location || undefined,
      supportEmail: supportEmail || undefined,
    };
  } catch {
    return {};
  }
}

async function crawlBusinessWebsite(startUrl: string): Promise<Awaited<ReturnType<typeof crawlWebsite>>> {
  const olostepKey = process.env.OLOSTEP_API_KEY?.trim();
  if (olostepKey) {
    try {
      const pages = await crawlWebsiteWithOlostep(startUrl, olostepKey, {
        maxPages: MAX_SCAN_PAGES,
      });
      if (pages.length > 0) {
        console.log(`[onboarding-scan] Olostep crawled ${pages.length} pages for ${startUrl}`);
        return pages;
      }
      console.warn("[onboarding-scan] Olostep returned no pages, falling back to basic crawl");
    } catch (err) {
      console.warn("[onboarding-scan] Olostep crawl failed, falling back to basic crawl", err);
    }
  }
  return crawlWebsite(startUrl, { maxPages: 6 });
}

async function processOnboardingScan(
  job: { updateProgress(p: unknown): Promise<void> },
  data: OnboardingScanJobData,
): Promise<OnboardingScanResult> {
  await job.updateProgress({ stage: "reading", pct: 10 });

  let scannedPages: Awaited<ReturnType<typeof crawlWebsite>> = [];
  if (data.businessWebsite) {
    await job.updateProgress({ stage: "scanning", pct: 25 });
    scannedPages = await crawlBusinessWebsite(data.businessWebsite);
  }
  const researchedWebsite = scannedPages.length > 0;

  const websiteContext = scannedPages
    .map((p) => `### ${p.title || p.url}\n${p.text}`)
    .join("\n\n")
    .slice(0, WEBSITE_CONTEXT_CHARS);

  let refinedLocation = data.businessLocation;
  let refinedSupportEmail = data.supportEmail;
  if (websiteContext && (!refinedLocation || !refinedSupportEmail)) {
    try {
      const { content } = await chatWithModelFallback(
        [
          {
            role: "system",
            content:
              'Extract structured business info from the website text as JSON only: {"location": string|null, "supportEmail": string|null}. Use null when not found. No markdown, no commentary.',
          },
          { role: "user", content: `Website research:\n${websiteContext}` },
        ],
        ONBOARDING_MODEL_CHAIN,
        { temperature: 0.1, maxTokens: 200, textOnly: true },
      );
      const extracted = parseExtractedFields(content);
      refinedLocation ??= extracted.location;
      refinedSupportEmail ??= extracted.supportEmail;
    } catch (err) {
      console.warn("[onboarding-scan] field extraction failed", err);
    }
  }

  await job.updateProgress({ stage: "knowledge", pct: 55 });
  if (data.projectId && scannedPages.length > 0) {
    await prisma.knowledgeDocument.deleteMany({
      where: { projectId: data.projectId, sourceType: "url" },
    });
    for (const page of scannedPages) {
      const doc = await prisma.knowledgeDocument.create({
        data: {
          projectId: data.projectId,
          title: page.title || page.url,
          sourceType: "url",
          rawContent: `Source: ${page.url}\n\n${page.text}`,
          status: "PENDING",
        },
      });
      try {
        await processIngest(doc.id, data.projectId);
      } catch (err) {
        console.warn(`[onboarding-scan] ingest failed for ${page.url}`, err);
      }
    }
  }

  await job.updateProgress({ stage: "questions", pct: 80 });
  const fallbackPairs: QuestionPair[] = FALLBACK_QUESTIONS.slice(0, MAX_QUESTIONS).map((q) => ({
    question: q,
    suggestedAnswer: "",
  }));
  let pairs: QuestionPair[] = fallbackPairs;
  let model: string | null = null;
  try {
    const { content, model: usedModel } = await chatWithModelFallback(
      [
        {
          role: "system",
          content: `You help set up a website support chatbot. Return ONLY a JSON array of exactly ${MAX_QUESTIONS} objects:
[{"question": string, "suggestedAnswer": string}, ...]

Rules:
- Each question should be short and specific for a business owner to confirm or edit.
- Each suggestedAnswer must be a concrete draft answer grounded in the website research when possible (pricing, features, contact, policies, hours, etc.).
- If the website does not contain enough info for an answer, write a brief honest placeholder the owner can fill in (e.g. "Contact support@… for pricing details").
- No markdown, no commentary, JSON only.`,
        },
        {
          role: "user",
          content: `Business: ${data.businessName}
Industry: ${data.businessIndustry}
Website: ${data.businessWebsite || "n/a"}
Location: ${refinedLocation || "n/a"}
Support email: ${refinedSupportEmail || "n/a"}
Description: ${data.businessDescription}${websiteContext ? `\n\nWebsite research (public page content from ${scannedPages.length} pages):\n${websiteContext}` : ""}

Generate ${MAX_QUESTIONS} onboarding question + suggestedAnswer pairs tailored to this business.`,
        },
      ],
      ONBOARDING_MODEL_CHAIN,
      { temperature: 0.35, maxTokens: 3500 },
    );
    const parsed = parseQuestionPairs(content);
    if (parsed) {
      pairs = parsed;
      model = usedModel;
    }
  } catch (err) {
    console.warn("[onboarding-scan] question generation failed, using fallbacks", err);
  }

  const questions = pairs.map((p) => p.question);
  const suggestedAnswers = pairs.map((p) => p.suggestedAnswer);

  await prisma.user.update({
    where: { id: data.userId },
    data: {
      businessName: data.businessName,
      businessWebsite: data.businessWebsite || null,
      businessIndustry: data.businessIndustry,
      businessDescription: data.businessDescription,
      onboardingQuestions: questions,
    },
  });

  await job.updateProgress({ stage: "questions", pct: 100 });

  return {
    questions,
    suggestedAnswers,
    model,
    researchedWebsite,
    scannedPageCount: scannedPages.length,
    businessLocation: refinedLocation,
    supportEmail: refinedSupportEmail,
  };
}

export function startOnboardingScanWorker(redisUrl: string) {
  const worker = new Worker(
    QUEUE_NAMES.ONBOARDING_SCAN,
    async (job) => {
      console.log(`[onboarding-scan] processing job ${job.id} for user ${job.data.userId}`);
      const result = await processOnboardingScan(job, job.data as OnboardingScanJobData);
      console.log(
        `[onboarding-scan] done job ${job.id} — ${result.questions.length} questions, ${result.suggestedAnswers.filter((a) => a.trim()).length} suggested answers`,
      );
      return result;
    },
    {
      connection: { url: redisUrl },
      concurrency: 3,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[onboarding-scan] failed job ${job?.id}`, err.message);
  });

  return worker;
}
