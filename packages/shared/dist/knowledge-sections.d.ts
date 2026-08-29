export type KnowledgeSection = "onboarding" | "faq" | "document";
export declare function classifyKnowledgeDoc(doc: {
    title: string;
    sourceType: string;
    rawContent: string;
}): KnowledgeSection;
export declare function formatQaContent(question: string, answer: string): string;
export declare function replaceQaAtIndex(raw: string, index: number, question: string, answer: string): string;
export declare function removeQaAtIndex(raw: string, index: number): string;
//# sourceMappingURL=knowledge-sections.d.ts.map