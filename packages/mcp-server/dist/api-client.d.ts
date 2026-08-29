export type QuickStartApiConfig = {
    apiUrl: string;
    token: string;
    projectId?: string;
};
export declare class QuickStartApiError extends Error {
    status: number;
    body?: unknown | undefined;
    constructor(message: string, status: number, body?: unknown | undefined);
}
export declare class QuickStartApiClient {
    private cfg;
    constructor(cfg: QuickStartApiConfig);
    private request;
    getBusinessProfile(): Promise<{
        success: boolean;
        onboarding: {
            onboardingCompleted: boolean;
            businessName: string | null;
            businessWebsite: string | null;
            businessIndustry: string | null;
            businessDescription: string | null;
            businessLocation?: string;
            supportEmail?: string;
            onboardingQuestions: unknown;
            onboardingAnswers: unknown;
            defaultProjectId: string | null;
            defaultProjectName: string | null;
            onboardingDocId: string | null;
        };
    }>;
    saveBusinessProfile(body: Record<string, unknown>): Promise<{
        success: boolean;
        business: Record<string, unknown>;
    }>;
    listProjects(): Promise<{
        success: boolean;
        projects: {
            id: string;
            name: string;
            description: string | null;
            category: string | null;
        }[];
    }>;
    resolveProjectId(): Promise<string>;
    listKnowledge(projectId: string): Promise<{
        success: boolean;
        documents: {
            id: string;
            title: string;
            status: string;
            sourceType: string;
            rawContent: string;
        }[];
    }>;
    addFaq(projectId: string, title: string, question: string, answer: string): Promise<{
        success: boolean;
        document: {
            id: string;
            title: string;
            status: string;
        };
    }>;
    listSessions(projectId: string, limit?: number): Promise<{
        success: boolean;
        sessions: {
            id: string;
            visitorName: string;
            visitorEmail: string;
            messageCount: number;
            lastMessage: string;
            updatedAt: string;
            createdAt: string;
        }[];
    }>;
    getSession(projectId: string, sessionId: string): Promise<{
        success: boolean;
        session: {
            id: string;
            visitorName: string;
            visitorEmail: string;
            memorySummary: string;
            messageCount: number;
            messages: {
                role: string;
                content: string;
                createdAt?: string;
            }[];
            updatedAt: string;
            createdAt: string;
        };
    }>;
    searchSessions(projectId: string, query: string, limit?: number): Promise<{
        success: boolean;
        query: string;
        sessions: {
            id: string;
            visitorName: string;
            visitorEmail: string;
            messageCount: number;
            lastMessage: string;
            updatedAt: string;
            createdAt: string;
        }[];
    }>;
}
export declare function loadConfigFromEnv(): QuickStartApiConfig;
//# sourceMappingURL=api-client.d.ts.map