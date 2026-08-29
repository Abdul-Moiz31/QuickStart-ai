/** Parse Q/A pairs from onboarding FAQ or pasted FAQ text (`Q:` / `A:` blocks). */
export function parseKnowledgeQa(raw) {
    const text = raw.trim();
    if (!text)
        return [];
    const pairs = [];
    const qaBlock = /(?:^|\n)\s*Q:\s*([\s\S]*?)(?:\n)\s*A:\s*([\s\S]*?)(?=(?:\n)\s*Q:|$)/gi;
    let m;
    while ((m = qaBlock.exec(text)) !== null) {
        const question = m[1]?.trim();
        const answer = m[2]?.trim();
        if (question && answer)
            pairs.push({ question, answer });
    }
    return pairs;
}
//# sourceMappingURL=knowledge.js.map