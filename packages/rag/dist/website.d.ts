/**
 * Lightweight public-page research for onboarding (no queue).
 * Fetches HTML and extracts readable text for the LLM prompt.
 */
export declare function fetchWebsiteSummary(url: string, opts?: {
    maxChars?: number;
    timeoutMs?: number;
}): Promise<string | null>;
//# sourceMappingURL=website.d.ts.map