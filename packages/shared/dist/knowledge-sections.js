import { parseKnowledgeQa } from "./knowledge.js";
export function classifyKnowledgeDoc(doc) {
    if (doc.rawContent.includes("Business profile") ||
        doc.title.toLowerCase().includes("onboarding")) {
        return "onboarding";
    }
    if (doc.sourceType === "faq")
        return "faq";
    if (parseKnowledgeQa(doc.rawContent).length > 0)
        return "faq";
    return "document";
}
export function formatQaContent(question, answer) {
    return `Q: ${question.trim()}\nA: ${answer.trim()}`;
}
export function replaceQaAtIndex(raw, index, question, answer) {
    const pairs = parseKnowledgeQa(raw);
    if (index < 0 || index >= pairs.length)
        throw new Error("Invalid Q&A index");
    pairs[index] = { question: question.trim(), answer: answer.trim() };
    return rebuildContentWithQa(raw, pairs);
}
export function removeQaAtIndex(raw, index) {
    const pairs = parseKnowledgeQa(raw);
    if (index < 0 || index >= pairs.length)
        throw new Error("Invalid Q&A index");
    pairs.splice(index, 1);
    return rebuildContentWithQa(raw, pairs);
}
function rebuildContentWithQa(raw, pairs) {
    const profileMatch = raw.match(/^([\s\S]*?)(?:\n\nQ&A:|$)/i);
    const header = profileMatch?.[1]?.trim() ?? "";
    const qaText = pairs.map((p) => formatQaContent(p.question, p.answer)).join("\n\n");
    if (header.includes("Business profile")) {
        return qaText ? `${header}\n\nQ&A:\n${qaText}` : header;
    }
    return qaText || header;
}
//# sourceMappingURL=knowledge-sections.js.map