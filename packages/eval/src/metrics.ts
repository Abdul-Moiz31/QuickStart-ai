export interface EvalCase {
  id: string;
  question: string;
  expected: string;
  contexts?: string[];
}

export interface EvalCaseResult {
  id: string;
  question: string;
  expected: string;
  answer: string;
  faithfulness: number;
  answerRelevancy: number;
  contextRelevance: number;
  expectedOverlap: number;
  latencyMs: number;
}

export interface EvalSummary {
  count: number;
  faithfulness: number;
  answerRelevancy: number;
  contextRelevance: number;
  expectedOverlap: number;
  avgLatencyMs: number;
  results: EvalCaseResult[];
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function scoreFaithfulness(answer: string, contexts: string[]): number {
  if (!contexts.length) return answer.length === 0 ? 1 : 0.2;
  const ctxTokens = tokenize(contexts.join(" "));
  const ansTokens = tokenize(answer);
  return jaccard(ansTokens, ctxTokens);
}

export function scoreAnswerRelevancy(question: string, answer: string): number {
  return jaccard(tokenize(question), tokenize(answer));
}

export function scoreContextRelevance(question: string, contexts: string[]): number {
  if (!contexts.length) return 0;
  return jaccard(tokenize(question), tokenize(contexts.join(" ")));
}

export function scoreExpectedOverlap(answer: string, expected: string): number {
  return jaccard(tokenize(answer), tokenize(expected));
}

export async function runEval(
  cases: EvalCase[],
  answerFn: (c: EvalCase) => Promise<{ answer: string; contexts: string[] }>,
): Promise<EvalSummary> {
  const results: EvalCaseResult[] = [];
  for (const c of cases) {
    const start = Date.now();
    const { answer, contexts } = await answerFn(c);
    const latencyMs = Date.now() - start;
    const ctx = contexts.length ? contexts : [c.expected];
    results.push({
      id: c.id,
      question: c.question,
      expected: c.expected,
      answer,
      faithfulness: scoreFaithfulness(answer, ctx),
      answerRelevancy: scoreAnswerRelevancy(c.question, answer),
      contextRelevance: scoreContextRelevance(c.question, ctx),
      expectedOverlap: scoreExpectedOverlap(answer, c.expected),
      latencyMs,
    });
  }
  const avg = (
    key: keyof Pick<
      EvalCaseResult,
      "faithfulness" | "answerRelevancy" | "contextRelevance" | "expectedOverlap" | "latencyMs"
    >,
  ) => results.reduce((s, r) => s + r[key], 0) / (results.length || 1);

  return {
    count: results.length,
    faithfulness: avg("faithfulness"),
    answerRelevancy: avg("answerRelevancy"),
    contextRelevance: avg("contextRelevance"),
    expectedOverlap: avg("expectedOverlap"),
    avgLatencyMs: avg("latencyMs"),
    results,
  };
}

export const SAMPLE_GOLDEN_SET: EvalCase[] = [
  {
    id: "hours",
    question: "What are your business hours?",
    expected: "We are open Monday to Friday 9 AM to 6 PM.",
    contexts: ["Business hours: Monday to Friday 9 AM to 6 PM."],
  },
  {
    id: "pricing",
    question: "How much does the starter plan cost?",
    expected: "The starter plan is $29 per month.",
    contexts: ["Starter plan pricing is $29/month including 200 credits."],
  },
  {
    id: "support",
    question: "How can I contact support?",
    expected: "Email support@quickstart-ai.me or use the in-app chat.",
    contexts: ["Contact support via support@quickstart-ai.me or in-app chat."],
  },
];

export type EvalPassThresholds = {
  faithfulness: number;
  answerRelevancy: number;
  expectedOverlap: number;
  minPassRate: number;
};

/** Per-case pass: enough overlap with expected answer, or solid faithfulness + relevancy. */
export function casePassed(
  r: Pick<EvalCaseResult, "faithfulness" | "answerRelevancy" | "expectedOverlap">,
): boolean {
  if (r.expectedOverlap >= 0.16) return true;
  return r.faithfulness >= 0.2 && r.answerRelevancy >= 0.1;
}

export function evaluatePass(
  summary: EvalSummary,
  thresholds: EvalPassThresholds,
): { passed: boolean; passRate: number; reasons: string[] } {
  const passCount = summary.results.filter(casePassed).length;
  const passRate = summary.count === 0 ? 0 : passCount / summary.count;
  const reasons: string[] = [];

  if (summary.faithfulness < thresholds.faithfulness) {
    reasons.push(
      `Faithfulness ${(summary.faithfulness * 100).toFixed(0)}% below ${(thresholds.faithfulness * 100).toFixed(0)}%`,
    );
  }
  if (summary.answerRelevancy < thresholds.answerRelevancy) {
    reasons.push(
      `Answer relevancy ${(summary.answerRelevancy * 100).toFixed(0)}% below ${(thresholds.answerRelevancy * 100).toFixed(0)}%`,
    );
  }
  if (summary.expectedOverlap < thresholds.expectedOverlap) {
    reasons.push(
      `Expected overlap ${(summary.expectedOverlap * 100).toFixed(0)}% below ${(thresholds.expectedOverlap * 100).toFixed(0)}%`,
    );
  }
  if (passRate < thresholds.minPassRate) {
    reasons.push(
      `Only ${(passRate * 100).toFixed(0)}% of questions passed (need ${(thresholds.minPassRate * 100).toFixed(0)}%)`,
    );
  }

  return {
    passed: reasons.length === 0 && summary.count > 0,
    passRate,
    reasons,
  };
}
