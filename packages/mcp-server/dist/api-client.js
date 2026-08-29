export class QuickStartApiError extends Error {
    status;
    body;
    constructor(message, status, body) {
        super(message);
        this.status = status;
        this.body = body;
        this.name = "QuickStartApiError";
    }
}
export class QuickStartApiClient {
    cfg;
    constructor(cfg) {
        this.cfg = cfg;
    }
    async request(path, options = {}) {
        const res = await fetch(`${this.cfg.apiUrl}${path}`, {
            method: options.method ?? "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.cfg.token}`,
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
        const data = (await res.json().catch(() => ({})));
        if (!res.ok) {
            throw new QuickStartApiError(data.message ??
                data.error ??
                `HTTP ${res.status}`, res.status, data);
        }
        return data;
    }
    async getBusinessProfile() {
        return this.request("/api/v1/onboarding");
    }
    async saveBusinessProfile(body) {
        return this.request("/api/v1/onboarding/business", { method: "PATCH", body });
    }
    async listProjects() {
        return this.request("/api/v1/projects");
    }
    async resolveProjectId() {
        if (this.cfg.projectId)
            return this.cfg.projectId;
        const profile = await this.getBusinessProfile();
        const id = profile.onboarding.defaultProjectId;
        if (!id)
            throw new Error("No project found. Complete onboarding or set QUICKSTART_PROJECT_ID.");
        return id;
    }
    async listKnowledge(projectId) {
        return this.request(`/api/v1/projects/${projectId}/knowledge`);
    }
    async addFaq(projectId, title, question, answer) {
        return this.request(`/api/v1/projects/${projectId}/knowledge`, {
            method: "POST",
            body: {
                title,
                content: `Q: ${question.trim()}\nA: ${answer.trim()}`,
                sourceType: "faq",
            },
        });
    }
    async listSessions(projectId, limit) {
        const params = limit ? `?limit=${limit}` : "";
        return this.request(`/api/v1/projects/${projectId}/sessions${params}`);
    }
    async getSession(projectId, sessionId) {
        return this.request(`/api/v1/projects/${projectId}/sessions/${sessionId}`);
    }
    async searchSessions(projectId, query, limit) {
        const params = new URLSearchParams({ q: query });
        if (limit)
            params.set("limit", String(limit));
        return this.request(`/api/v1/projects/${projectId}/sessions/search?${params}`);
    }
}
export function loadConfigFromEnv() {
    const apiUrl = (process.env.QUICKSTART_API_URL ?? "http://localhost:3100").replace(/\/$/, "");
    const token = process.env.QUICKSTART_API_TOKEN?.trim();
    if (!token) {
        throw new Error("QUICKSTART_API_TOKEN is required. Log in at /login and paste your JWT, or run: curl -X POST .../auth/login");
    }
    const projectId = process.env.QUICKSTART_PROJECT_ID?.trim() || undefined;
    return { apiUrl, token, projectId };
}
//# sourceMappingURL=api-client.js.map