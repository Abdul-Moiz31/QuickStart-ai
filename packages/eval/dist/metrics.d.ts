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
export declare function scoreFaithfulness(answer: string, contexts: string[]): number;
export declare function scoreAnswerRelevancy(question: string, answer: string): number;
export declare function scoreContextRelevance(question: string, contexts: string[]): number;
export declare function scoreExpectedOverlap(answer: string, expected: string): number;
export declare function runEval(cases: EvalCase[], answerFn: (c: EvalCase) => Promise<{
    answer: string;
    contexts: string[];
}>): Promise<EvalSummary>;
export declare const SAMPLE_GOLDEN_SET: EvalCase[];
export type EvalPassThresholds = {
    faithfulness: number;
    answerRelevancy: number;
    expectedOverlap: number;
    minPassRate: number;
};
/** Per-case pass: enough overlap with expected answer, or solid faithfulness + relevancy. */
export declare function casePassed(r: Pick<EvalCaseResult, "faithfulness" | "answerRelevancy" | "expectedOverlap">): boolean;
export declare function evaluatePass(summary: EvalSummary, thresholds: EvalPassThresholds): {
    passed: boolean;
    passRate: number;
    reasons: string[];
};
//# sourceMappingURL=metrics.d.ts.map