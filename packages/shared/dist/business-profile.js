import { parseKnowledgeQa } from "./knowledge.js";
export function parseBusinessProfileExtras(raw) {
    const location = raw.match(/^Location:\s*(.+)$/m)?.[1]?.trim();
    const support = raw.match(/^Support:\s*(.+)$/m)?.[1]?.trim();
    return {
        businessLocation: location && location !== "n/a" ? location : undefined,
        supportEmail: support && support !== "n/a" ? support : undefined,
    };
}
export function buildBusinessProfileHeader(fields) {
    return `Business profile
Name: ${fields.businessName}
Industry: ${fields.businessIndustry}
Website: ${fields.businessWebsite || "n/a"}
Location: ${fields.businessLocation || "n/a"}
Support: ${fields.supportEmail || "n/a"}

Description:
${fields.businessDescription}`;
}
/** Rebuild onboarding doc: profile header + optional Q&A block. */
export function rebuildOnboardingDocContent(fields, qaPairs) {
    const header = buildBusinessProfileHeader(fields);
    if (!qaPairs?.length)
        return header;
    const qaText = qaPairs.map((p) => `Q: ${p.question.trim()}\nA: ${p.answer.trim()}`).join("\n\n");
    return `${header}\n\nQ&A:\n${qaText}`;
}
export function extractQaFromOnboardingDoc(raw) {
    const qaMatch = raw.match(/\n\nQ&A:\n([\s\S]*)$/i);
    if (!qaMatch)
        return [];
    return parseKnowledgeQa(qaMatch[1] ?? "");
}
//# sourceMappingURL=business-profile.js.map