import { Worker } from "bullmq";
import { prisma } from "@quickstart-ai/db";
import {
  ONBOARDING_MAX_QUESTIONS,
  ONBOARDING_MODEL_CHAIN,
  ONBOARDING_WEBSITE_CONTEXT_CHARS,
  chatWithModelFallback,
  crawlWebsite,
  crawlWebsiteWithOlostep,
  generateOnboardingQuestionPairs,
} from "@quickstart-ai/rag";
import { QUEUE_NAMES, type OnboardingScanResult } from "@quickstart-ai/shared";
import { processIngest } from "./ingest-job.js";

const MAX_SCAN_PAGES = 15;
const WEBSITE_CONTEXT_CHARS = ONBOARDING_WEBSITE_CONTEXT_CHARS;

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
  const { pairs, model } = await generateOnboardingQuestionPairs({
    businessName: data.businessName,
    businessIndustry: data.businessIndustry,
    businessWebsite: data.businessWebsite,
    businessDescription: data.businessDescription,
    businessLocation: refinedLocation,
    supportEmail: refinedSupportEmail,
    websiteContext: websiteContext
      ? `${websiteContext}\n\n(from ${scannedPages.length} pages)`
      : undefined,
    count: ONBOARDING_MAX_QUESTIONS,
  });

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
