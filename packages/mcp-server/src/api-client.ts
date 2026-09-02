export type QuickStartApiConfig = {
  apiUrl: string;
  token: string;
  projectId?: string;
};

export class QuickStartApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "QuickStartApiError";
  }
}

export class QuickStartApiClient {
  constructor(private cfg: QuickStartApiConfig) {}

  private async request<T>(
    path: string,
    options: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    const res = await fetch(`${this.cfg.apiUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.cfg.token}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = (await res.json().catch(() => ({}))) as T & {
      message?: string;
      error?: string;
    };

    if (!res.ok) {
      throw new QuickStartApiError(
        (data as { message?: string }).message ??
          (data as { error?: string }).error ??
          `HTTP ${res.status}`,
        res.status,
        data,
      );
    }

    return data;
  }

  async getBusinessProfile() {
    return this.request<{
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
    }>("/api/v1/onboarding");
  }

  async updateBusinessProfile(body: Record<string, unknown>) {
    return this.request<{ success: boolean; business: Record<string, unknown> }>(
      "/api/v1/onboarding/business",
      { method: "PATCH", body },
    );
  }

  async listProjects() {
    return this.request<{
      success: boolean;
      projects: {
        id: string;
        name: string;
        description: string | null;
        category: string | null;
      }[];
    }>("/api/v1/projects");
  }

  async resolveProjectId(): Promise<string> {
    if (this.cfg.projectId) return this.cfg.projectId;
    const profile = await this.getBusinessProfile();
    const id = profile.onboarding.defaultProjectId;
    if (!id) throw new Error("No project found. Complete onboarding or set QUICKSTART_PROJECT_ID.");
    return id;
  }

  async getProject(projectId: string) {
    return this.request<{
      success: boolean;
      project: {
        id: string;
        name: string;
        description: string | null;
        category: string | null;
        plan: string;
        credits?: number;
        chatbotEnabled: boolean;
        evalPassedAt: string | null;
        memberRole: string;
        isOwner: boolean;
        createdAt: string;
      };
      documents: { id: string; status: string }[];
    }>(`/api/v1/projects/${projectId}`);
  }

  async listKnowledge(projectId: string) {
    return this.request<{
      success: boolean;
      documents: {
        id: string;
        title: string;
        status: string;
        sourceType: string;
        rawContent: string;
      }[];
    }>(`/api/v1/projects/${projectId}/knowledge`);
  }

  async addFaq(projectId: string, title: string, question: string, answer: string) {
    return this.request<{ success: boolean; document: { id: string; title: string; status: string } }>(
      `/api/v1/projects/${projectId}/knowledge`,
      {
        method: "POST",
        body: {
          title,
          content: `Q: ${question.trim()}\nA: ${answer.trim()}`,
          sourceType: "faq",
        },
      },
    );
  }

  async updateFaq(
    projectId: string,
    docId: string,
    qaIndex: number,
    question: string,
    answer: string,
  ) {
    return this.request<{
      success: boolean;
      document: { id: string; title: string; status: string };
    }>(`/api/v1/projects/${projectId}/knowledge/${docId}`, {
      method: "PATCH",
      body: { qaIndex, question: question.trim(), answer: answer.trim() },
    });
  }

  async deleteFaq(projectId: string, docId: string, qaIndex: number) {
    return this.request<{
      success: boolean;
      document: { id: string; title: string; status: string };
    }>(`/api/v1/projects/${projectId}/knowledge/${docId}/qa`, {
      method: "DELETE",
      body: { qaIndex },
    });
  }

  async listSessions(projectId: string, limit?: number) {
    const params = limit ? `?limit=${limit}` : "";
    return this.request<{
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
    }>(`/api/v1/projects/${projectId}/sessions${params}`);
  }

  async getSession(projectId: string, sessionId: string) {
    return this.request<{
      success: boolean;
      session: {
        id: string;
        visitorName: string;
        visitorEmail: string;
        memorySummary: string;
        messageCount: number;
        messages: { role: string; content: string; createdAt?: string }[];
        updatedAt: string;
        createdAt: string;
      };
    }>(`/api/v1/projects/${projectId}/sessions/${sessionId}`);
  }

  async searchSessions(projectId: string, query: string, limit?: number) {
    const params = new URLSearchParams({ q: query });
    if (limit) params.set("limit", String(limit));
    return this.request<{
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
    }>(`/api/v1/projects/${projectId}/sessions/search?${params}`);
  }

  async getAnalytics(projectId: string, period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : "";
    return this.request<{
      success: boolean;
      period: string;
      analytics: {
        totalConversations: number;
        totalMessages: number;
        avgMessagesPerSession: number;
        analysedAnswers: number;
        answerQuality: number | null;
        qualityBreakdown: { strong: number; weak: number; unscored: number };
        escalationRate: number;
        leadCaptureRate: number;
        dailyVolume: { date: string; count: number }[];
        topToolsUsed: { tool: string; count: number }[];
      };
    }>(`/api/v1/projects/${projectId}/analytics${params}`);
  }

  async listKnowledgeGaps(projectId: string, period?: string) {
    const params = period ? `?period=${encodeURIComponent(period)}` : "";
    return this.request<{
      success: boolean;
      period: string;
      analysedAnswers: number;
      resolvedCount: number;
      gaps: {
        question: string;
        sessionCount: number;
        lastAskedAt: string | null;
        sessionIds: string[];
        precision: number | null;
        topScore: number | null;
      }[];
    }>(`/api/v1/projects/${projectId}/knowledge-gaps${params}`);
  }

  async getEvalStatus(projectId: string) {
    return this.request<{
      success: boolean;
      status: {
        qaCount: number;
        minQaRequired: number;
        hasEnoughKnowledge: boolean;
        readyDocCount: number;
        evalPassedAt: string | null;
        productionReady: boolean;
        readiness: Record<string, unknown>;
        activeRun: { id: string; status: string; createdAt: string } | null;
        lastRun: {
          id: string;
          status: string;
          metrics: unknown;
          finishedAt: string | null;
          createdAt: string;
        } | null;
      };
    }>(`/api/v1/projects/${projectId}/eval/status`);
  }

  async listInbox(projectId: string) {
    return this.request<{
      success: boolean;
      sessions: {
        id: string;
        visitorName: string;
        visitorEmail: string;
        humanPending: boolean;
        humanActive: boolean;
        stale: boolean;
        agent: { name?: string; email?: string } | null;
        escalatedAt: string | null;
        takenOverAt: string | null;
        messageCount: number;
        lastMessage: { role: string; content: string } | null;
        updatedAt: string | null;
      }[];
    }>(`/api/v1/projects/${projectId}/inbox`);
  }
}

export function loadConfigFromEnv(): QuickStartApiConfig {
  const apiUrl = (process.env.QUICKSTART_API_URL ?? "http://localhost:3100").replace(/\/$/, "");
  const token = process.env.QUICKSTART_API_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "QUICKSTART_API_TOKEN is required. Log in at /login and paste your JWT, or run: curl -X POST .../auth/login",
    );
  }
  const projectId = process.env.QUICKSTART_PROJECT_ID?.trim() || undefined;
  return { apiUrl, token, projectId };
}
