import { getChatSessionModel } from "@quickstart-ai/db";
import { KNOWLEDGE_GAP_TOP_SCORE } from "@quickstart-ai/shared";
import { getRedis } from "./redis.js";
function messageMeta(m) {
    return (m.meta ?? {});
}
/**
 * Whether an answer was weak enough to count as a gap.
 *
 * topScore is authoritative when present. Messages written before it existed only
 * carry the averaged confidence, which is kept as a fallback so the page has
 * history on day one rather than waiting for new traffic.
 */
export function classifyAnswer(m) {
    const meta = messageMeta(m);
    if (typeof meta.topScore === "number") {
        return {
            isGap: meta.topScore < KNOWLEDGE_GAP_TOP_SCORE,
            topScore: meta.topScore,
            precision: "high",
        };
    }
    return { isGap: meta.confidence === "low", topScore: null, precision: "low" };
}
/**
 * Pulls weak answers out of a project's sessions and pairs each with its question.
 *
 * Sessions are the source rather than ProjectEvent: the knowledge.gap event only
 * fired when retrieval returned zero chunks, which never happens once a project has
 * knowledge, so that table holds nothing. Sessions also survive the fire-and-forget
 * event bus, and they already store what is needed.
 */
export async function collectGapCandidates(opts) {
    const Session = getChatSessionModel();
    const sessions = await Session.find({
        projectId: opts.projectId,
        updatedAt: { $gte: opts.since },
    })
        .select("messages")
        .lean();
    const candidates = [];
    // Every answer we looked at, not just the weak ones. The empty state needs to
    // tell "bot is doing fine" apart from "nobody has chatted yet", and counting
    // only gaps makes a flawless bot look like an idle one.
    let analysedAnswers = 0;
    for (const session of sessions) {
        const messages = session.messages ?? [];
        messages.forEach((m, i) => {
            if (m.role !== "assistant")
                return;
            const meta = messageMeta(m);
            // Superseded by a human takeover; the visitor never saw it, so it says
            // nothing about whether the knowledge base could answer.
            if (meta.suppressed)
                return;
            const prevTurn = messages[i - 1];
            const answeredAQuestion = Boolean(prevTurn && prevTurn.role === "user");
            if (answeredAQuestion)
                analysedAnswers += 1;
            const { isGap, topScore, precision } = classifyAnswer(m);
            if (!isGap)
                return;
            // chat.ts always pushes the user turn immediately before the assistant turn,
            // so the previous message is the question. The seeded greeting has no
            // preceding user turn and is skipped by the same check.
            if (!prevTurn || prevTurn.role !== "user")
                return;
            const question = prevTurn.content.trim();
            if (!question)
                return;
            // No timestamp means we cannot place it in the window; treating it as "now"
            // would smuggle arbitrarily old turns into a 30-day view.
            const askedAt = m.createdAt;
            if (!askedAt || askedAt < opts.since)
                return;
            candidates.push({
                sessionId: String(session._id),
                question,
                askedAt,
                topScore,
                precision,
            });
        });
    }
    return { candidates, analysedAnswers };
}
export function periodToSince(period) {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
export const GAP_CACHE_PERIODS = ["7d", "30d", "90d"];
export function gapCacheKey(projectId, period) {
    return `gaps:${projectId}:${period}`;
}
/** Called after knowledge changes so a newly answered gap disappears immediately. */
export async function invalidateGapCache(projectId) {
    try {
        const redis = getRedis();
        if (redis.status !== "ready")
            await redis.connect();
        await redis.del(...GAP_CACHE_PERIODS.map((p) => gapCacheKey(projectId, p)));
    }
    catch {
        // Cache invalidation is best effort; entries expire on their own.
    }
}
//# sourceMappingURL=knowledge-gaps.js.map