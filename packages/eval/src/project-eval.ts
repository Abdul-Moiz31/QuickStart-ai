import { prisma } from "@quickstart-ai/db";
import {
  createChatClient,
  createEmbeddingsClient,
  runAgenticRag,
} from "@quickstart-ai/rag";
import {
  computeEvalReadiness,
  EVAL_PASS_THRESHOLDS,
  MIN_KNOWLEDGE_QA,
  parseKnowledgeQa,
  buildEmbeddingsRuntimeConfig,
  buildLlmRuntimeConfig,
} from "@quickstart-ai/shared";
import { decryptSecret } from "@quickstart-ai/shared/secrets";
import { casePassed, evaluatePass, runEval, type EvalCase } from "./metrics.js";

const MAX_EVAL_CASES = 15;
const CASE_DELAY_MS = 2500;

export type EvalProgress = {
  current: number;
  total: number;
  message: string;
  phase: "starting" | "evaluating" | "scoring" | "done";
};

export type EvalJobResult = {
  passed: boolean;
  passRate: number;
  reasons: string[];
  productionReady: boolean;
  readiness: ReturnType<typeof computeEvalReadiness>;
  summary: Awaited<ReturnType<typeof runEval>>;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadCases(projectId: string) {
  const docs = await prisma.knowledgeDocument.findMany({
    where: { projectId, status: "READY" },
    select: { rawContent: true },
  });
  const pairs = docs.flatMap((d) => parseKnowledgeQa(d.rawContent ?? ""));
  const cases: EvalCase[] = pairs.slice(0, MAX_EVAL_CASES).map((p, i) => ({
    id: `qa-${i + 1}`,
    question: p.question,
    expected: p.answer,
  }));
  return { pairs, cases };
}

async function updateProgress(runId: string, progress: EvalProgress, extra?: Record<string, unknown>) {
  const run = await prisma.evalRun.findUnique({ where: { id: runId } });
  const metrics = (run?.metrics ?? {}) as Record<string, unknown>;
  await prisma.evalRun.update({
    where: { id: runId },
    data: {
      status: progress.phase === "done" ? run?.status ?? "running" : "running",
      metrics: { ...metrics, ...extra, progress },
    },
  });
}

export async function executeProjectEval(runId: string, projectId: string): Promise<EvalJobResult> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  const { pairs, cases } = await loadCases(projectId);
  if (pairs.length < MIN_KNOWLEDGE_QA) {
    throw new Error(`Need at least ${MIN_KNOWLEDGE_QA} Q&A pairs (have ${pairs.length})`);
  }

  await prisma.evalRun.update({
    where: { id: runId },
    data: { status: "running" },
  });

  await updateProgress(runId, {
    current: 0,
    total: cases.length,
    message: "Starting evaluation…",
    phase: "starting",
  });

  const chatRuntime = buildLlmRuntimeConfig(project, decryptSecret);
  const embeddingsRuntime = buildEmbeddingsRuntimeConfig(project, decryptSecret);
  const embeddings = createEmbeddingsClient(embeddingsRuntime);
  const chat = createChatClient(chatRuntime);
  let caseIndex = 0;

  const summary = await runEval(cases, async (c) => {
    caseIndex += 1;
    await updateProgress(runId, {
      current: caseIndex,
      total: cases.length,
      message: `Testing question ${caseIndex} of ${cases.length}…`,
      phase: "evaluating",
    });

    if (caseIndex > 1) await sleep(CASE_DELAY_MS);

    try {
      const result = await runAgenticRag({
        projectId: project.id,
        projectName: project.name,
        systemPrompt: project.systemPrompt || undefined,
        query: c.question,
        history: [],
        embeddings,
        chat,
        useHyde: false,
        modelChainRotate: caseIndex,
      });
      return {
        answer: result.answer,
        contexts: result.chunks.map((ch) => ch.content),
      };
    } catch (err) {
      console.error("[eval] RAG failed for case", c.id, err);
      return { answer: "", contexts: [] };
    }
  });

  await updateProgress(runId, {
    current: cases.length,
    total: cases.length,
    message: "Scoring results…",
    phase: "scoring",
  });

  const verdict = evaluatePass(summary, EVAL_PASS_THRESHOLDS);
  const readiness = computeEvalReadiness({
    qaCount: pairs.length,
    minQaRequired: MIN_KNOWLEDGE_QA,
    hasEnoughKnowledge: true,
    lastRunStatus: verdict.passed ? "passed" : "failed",
    metrics: {
      faithfulness: summary.faithfulness,
      answerRelevancy: summary.answerRelevancy,
      contextRelevance: summary.contextRelevance,
      expectedOverlap: summary.expectedOverlap,
      avgLatencyMs: summary.avgLatencyMs,
      passRate: verdict.passRate,
      passed: verdict.passed,
    },
    thresholds: EVAL_PASS_THRESHOLDS,
  });

  await prisma.evalRun.update({
    where: { id: runId },
    data: {
      status: verdict.passed ? "passed" : "failed",
      finishedAt: new Date(),
      metrics: {
        faithfulness: summary.faithfulness,
        answerRelevancy: summary.answerRelevancy,
        contextRelevance: summary.contextRelevance,
        expectedOverlap: summary.expectedOverlap,
        avgLatencyMs: summary.avgLatencyMs,
        count: summary.count,
        passRate: verdict.passRate,
        passed: verdict.passed,
        reasons: verdict.reasons,
        readiness,
        results: summary.results.map((r) => ({
          id: r.id,
          question: r.question,
          answer: r.answer,
          passed: casePassed(r),
        })),
        progress: {
          current: cases.length,
          total: cases.length,
          message: verdict.passed ? "Evaluation complete" : "Evaluation complete — review scores",
          phase: "done",
        },
      },
    },
  });

  if (verdict.passed) {
    await prisma.project.update({
      where: { id: projectId },
      data: { evalPassedAt: new Date() },
    });
  }

  return {
    passed: verdict.passed,
    passRate: verdict.passRate,
    reasons: verdict.reasons,
    productionReady: readiness.productionReady,
    readiness,
    summary,
  };
}
