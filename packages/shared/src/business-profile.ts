import { parseKnowledgeQa } from "./knowledge.js";

export type BusinessProfileFields = {
  businessName: string;
  businessIndustry: string;
  businessWebsite?: string;
  businessLocation?: string;
  supportEmail?: string;
  businessDescription: string;
};

export function parseBusinessProfileExtras(raw: string): {
  businessLocation?: string;
  supportEmail?: string;
} {
  const location = raw.match(/^Location:\s*(.+)$/m)?.[1]?.trim();
  const support = raw.match(/^Support:\s*(.+)$/m)?.[1]?.trim();
  return {
    businessLocation: location && location !== "n/a" ? location : undefined,
    supportEmail: support && support !== "n/a" ? support : undefined,
  };
}

export function buildBusinessProfileHeader(fields: BusinessProfileFields): string {
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
export function rebuildOnboardingDocContent(
  fields: BusinessProfileFields,
  qaPairs?: { question: string; answer: string }[],
): string {
  const header = buildBusinessProfileHeader(fields);
  if (!qaPairs?.length) return header;
  const qaText = qaPairs.map((p) => `Q: ${p.question.trim()}\nA: ${p.answer.trim()}`).join("\n\n");
  return `${header}\n\nQ&A:\n${qaText}`;
}

export function extractQaFromOnboardingDoc(raw: string) {
  const qaMatch = raw.match(/\n\nQ&A:\n([\s\S]*)$/i);
  if (!qaMatch) return [];
  return parseKnowledgeQa(qaMatch[1] ?? "");
}
