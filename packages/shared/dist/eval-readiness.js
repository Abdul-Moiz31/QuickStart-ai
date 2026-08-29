function clamp01(n) {
    return Math.max(0, Math.min(1, n));
}
function categoryStatus(score, threshold, pending) {
    if (pending)
        return "pending";
    if (score >= threshold)
        return "good";
    if (score >= threshold * 0.55)
        return "fair";
    return "weak";
}
/** Faster responses score higher (3s ≈ 100%, 20s+ ≈ low). */
export function latencyScore(avgLatencyMs) {
    if (avgLatencyMs <= 0)
        return 0;
    if (avgLatencyMs <= 3000)
        return 1;
    if (avgLatencyMs >= 20000)
        return 0.12;
    return clamp01(1 - (avgLatencyMs - 3000) / 17000);
}
export function computeEvalReadiness(input) {
    const thresholds = input.thresholds ?? {
        faithfulness: 0.22,
        answerRelevancy: 0.12,
        expectedOverlap: 0.18,
        minPassRate: 0.55,
    };
    const knowledgeScore = clamp01(input.qaCount / Math.max(input.minQaRequired, 1));
    const m = input.metrics ?? {};
    const pending = input.lastRunStatus == null;
    const faithfulness = m.faithfulness ?? 0;
    const answerRelevancy = m.answerRelevancy ?? 0;
    const contextRelevance = m.contextRelevance ?? 0;
    const expectedOverlap = m.expectedOverlap ?? 0;
    const passRate = m.passRate ?? 0;
    const efficiency = latencyScore(m.avgLatencyMs ?? 0);
    const domainScore = pending ? 0 : (faithfulness + contextRelevance) / 2;
    const detailsScore = pending ? 0 : expectedOverlap;
    const relevanceScore = pending ? 0 : answerRelevancy;
    const efficiencyScore = pending ? 0 : efficiency;
    const categories = [
        {
            id: "domain",
            label: "Domain",
            hint: "Add more business context and FAQ coverage",
            score: domainScore,
            status: categoryStatus(domainScore, thresholds.faithfulness, pending),
        },
        {
            id: "details",
            label: "Details",
            hint: "Make FAQ answers more specific and complete",
            score: detailsScore,
            status: categoryStatus(detailsScore, thresholds.expectedOverlap, pending),
        },
        {
            id: "relevance",
            label: "Relevance",
            hint: "Ensure answers directly address each question",
            score: relevanceScore,
            status: categoryStatus(relevanceScore, thresholds.answerRelevancy, pending),
        },
        {
            id: "efficiency",
            label: "Efficiency",
            hint: "Slow responses — try again or check model load",
            score: efficiencyScore,
            status: categoryStatus(efficiencyScore, 0.45, pending),
        },
    ];
    const evalScore = pending
        ? 0
        : categories.reduce((s, c) => s + c.score, 0) / categories.length;
    const overallScore = pending
        ? knowledgeScore * 0.35
        : clamp01(knowledgeScore * 0.2 + evalScore * 0.8);
    const productionReady = input.hasEnoughKnowledge &&
        input.lastRunStatus === "passed" &&
        passRate >= thresholds.minPassRate;
    return {
        knowledgeScore,
        evalScore,
        overallScore,
        productionReady,
        categories,
    };
}
export function pct(n) {
    return `${Math.round(clamp01(n) * 100)}%`;
}
export function readinessLabel(score, hasRun) {
    if (!hasRun)
        return "Run eval to score quality";
    if (score >= 0.75)
        return "Strong for production";
    if (score >= 0.5)
        return "Usable — room to improve";
    if (score > 0)
        return "Needs work in some areas";
    return "Not evaluated yet";
}
//# sourceMappingURL=eval-readiness.js.map