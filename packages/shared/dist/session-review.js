export function isSessionReviewMeta(value) {
    if (!value || typeof value !== "object")
        return false;
    const v = value;
    return (typeof v.reviewedAt === "string" &&
        typeof v.summary === "string" &&
        Array.isArray(v.topics));
}
//# sourceMappingURL=session-review.js.map