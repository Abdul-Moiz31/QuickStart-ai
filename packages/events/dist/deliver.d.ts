export declare function deliverProjectEvent(eventId: string): Promise<void>;
/** Post a test ping directly to one integration (bypasses the event queue and subscriptions). */
export declare function deliverTestPingToIntegration(opts: {
    projectId: string;
    provider: string;
    configEnc: string;
    label: string;
}): Promise<number>;
/** Post a test ping directly to one webhook endpoint. */
export declare function deliverTestPingToWebhook(opts: {
    projectId: string;
    url: string;
    secretEnc: string;
    label: string;
}): Promise<number>;
export declare function retryDelivery(deliveryId: string): Promise<void>;
//# sourceMappingURL=deliver.d.ts.map