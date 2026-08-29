export type EvalMetrics = {
    faithfulness?: number;
    answerRelevancy?: number;
    contextRelevance?: number;
    expectedOverlap?: number;
    passRate?: number;
    avgLatencyMs?: number;
    passed?: boolean;
};
export type EvalCategory = {
    id: string;
    label: string;
    hint: string;
    score: number;
    status: "good" | "fair" | "weak" | "pending";
};
export type EvalReadiness = {
    knowledgeScore: number;
    evalScore: number;
    overallScore: number;
    productionReady: boolean;
    categories: EvalCategory[];
};
/** Faster responses score higher (3s ≈ 100%, 20s+ ≈ low). */
export declare function latencyScore(avgLatencyMs: number): number;
export declare function computeEvalReadiness(input: {
    qaCount: number;
    minQaRequired: number;
    hasEnoughKnowledge: boolean;
    lastRunStatus?: string | null;
    metrics?: EvalMetrics | null;
    thresholds?: {
        faithfulness: number;
        answerRelevancy: number;
        expectedOverlap: number;
        minPassRate: number;
    };
}): EvalReadiness;
export declare function pct(n: number): string;
export declare function readinessLabel(score: number, hasRun: boolean): "Run eval to score quality" | "Strong for production" | "Usable — room to improve" | "Needs work in some areas" | "Not evaluated yet";
//# sourceMappingURL=eval-readiness.d.ts.map