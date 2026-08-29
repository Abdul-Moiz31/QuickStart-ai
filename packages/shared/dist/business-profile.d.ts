export type BusinessProfileFields = {
    businessName: string;
    businessIndustry: string;
    businessWebsite?: string;
    businessLocation?: string;
    supportEmail?: string;
    businessDescription: string;
};
export declare function parseBusinessProfileExtras(raw: string): {
    businessLocation?: string;
    supportEmail?: string;
};
export declare function buildBusinessProfileHeader(fields: BusinessProfileFields): string;
/** Rebuild onboarding doc: profile header + optional Q&A block. */
export declare function rebuildOnboardingDocContent(fields: BusinessProfileFields, qaPairs?: {
    question: string;
    answer: string;
}[]): string;
export declare function extractQaFromOnboardingDoc(raw: string): import("./knowledge.js").KnowledgeQaPair[];
//# sourceMappingURL=business-profile.d.ts.map