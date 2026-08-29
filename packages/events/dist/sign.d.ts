export declare function signWebhookPayload(secret: string, body: string, timestamp?: number): string;
export declare function verifyWebhookSignature(secret: string, body: string, header: string, toleranceSec?: number): boolean;
//# sourceMappingURL=sign.d.ts.map