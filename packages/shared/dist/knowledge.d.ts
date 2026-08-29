export type KnowledgeQaPair = {
    question: string;
    answer: string;
};
/** Parse Q/A pairs from onboarding FAQ or pasted FAQ text (`Q:` / `A:` blocks). */
export declare function parseKnowledgeQa(raw: string): KnowledgeQaPair[];
//# sourceMappingURL=knowledge.d.ts.map