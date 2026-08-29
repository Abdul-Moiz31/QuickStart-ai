export interface CustomToolParameter {
    name: string;
    description: string;
    required?: boolean;
}
export interface CustomToolRuntime {
    id: string;
    projectId: string;
    name: string;
    description: string;
    httpMethod: string;
    url: string;
    authHeaderEnc?: string | null;
    parameters: CustomToolParameter[];
    responseKey?: string | null;
    enabled: boolean;
}
export interface CustomToolExecuteContext {
    projectId: string;
    redisUrl?: string;
    /** When false, skip rate limiting (dashboard test). */
    applyRateLimit?: boolean;
}
export interface CustomToolExecuteResult {
    output: string;
    statusCode?: number;
    rawBody?: string;
}
export declare function formatCustomToolDescription(tool: CustomToolRuntime): string;
/** Replace `{product_id}`-style segments in the URL; leftover args go to query/body. */
export declare function applyUrlPathParams(urlTemplate: string, args: Record<string, unknown>): {
    url: string;
    remainingArgs: Record<string, unknown>;
} | {
    error: string;
};
export declare function executeCustomTool(tool: CustomToolRuntime, args: Record<string, unknown>, ctx: CustomToolExecuteContext): Promise<CustomToolExecuteResult>;
//# sourceMappingURL=custom-tools.d.ts.map