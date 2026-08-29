import { McpServer as McpServerImpl } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { classifyKnowledgeDoc, parseKnowledgeQa } from "@quickstart-ai/shared";
function textResult(data) {
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
}
export function registerQuickStartTools(server, getClient) {
    server.tool("get_business_profile", "Get the QuickStart AI business profile for the connected account (name, industry, description, location, support email, onboarding Q&A).", {}, async () => {
        const client = getClient();
        const res = await client.getBusinessProfile();
        const o = res.onboarding;
        return textResult({
            onboardingCompleted: o.onboardingCompleted,
            businessName: o.businessName,
            businessWebsite: o.businessWebsite,
            businessIndustry: o.businessIndustry,
            businessDescription: o.businessDescription,
            businessLocation: o.businessLocation ?? null,
            supportEmail: o.supportEmail ?? null,
            onboardingQuestions: o.onboardingQuestions,
            onboardingAnswers: o.onboardingAnswers,
            defaultProjectId: o.defaultProjectId,
            defaultProjectName: o.defaultProjectName,
        });
    });
    server.tool("save_business_profile", "Save or update business details in QuickStart AI. Provide any fields to change; omitted fields stay as-is. Updates the chatbot knowledge automatically.", {
        businessName: z.string().min(1).max(160).optional(),
        businessWebsite: z.string().url().max(300).optional(),
        businessIndustry: z.string().min(1).max(120).optional(),
        businessDescription: z.string().min(20).max(4000).optional(),
        businessLocation: z.string().max(160).optional(),
        supportEmail: z.string().email().max(160).optional(),
    }, async (args) => {
        const body = Object.fromEntries(Object.entries(args).filter(([, v]) => v !== undefined && v !== ""));
        if (Object.keys(body).length === 0) {
            return textResult({ error: "Provide at least one business field to save." });
        }
        const client = getClient();
        const res = await client.saveBusinessProfile(body);
        return textResult(res.business);
    });
    server.tool("list_faqs", "List FAQ knowledge entries for the QuickStart AI project (question/answer pairs the chatbot uses).", {
        projectId: z.string().uuid().optional().describe("Project ID; defaults to your primary project"),
    }, async ({ projectId }) => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.listKnowledge(pid);
        const faqs = res.documents
            .filter((d) => classifyKnowledgeDoc(d) === "faq")
            .flatMap((d) => parseKnowledgeQa(d.rawContent).map((qa, index) => ({
            documentId: d.id,
            documentTitle: d.title,
            qaIndex: index,
            question: qa.question,
            answer: qa.answer,
            status: d.status,
        })));
        const onboarding = res.documents.find((d) => classifyKnowledgeDoc(d) === "onboarding");
        return textResult({
            projectId: pid,
            faqCount: faqs.length,
            faqs,
            onboardingDocument: onboarding
                ? { id: onboarding.id, title: onboarding.title, status: onboarding.status }
                : null,
        });
    });
    server.tool("add_faq", "Add a FAQ question and answer to the QuickStart AI chatbot knowledge base.", {
        question: z.string().min(1).max(2000),
        answer: z.string().min(1).max(20000),
        title: z
            .string()
            .max(240)
            .optional()
            .describe("Optional document title; defaults to the question"),
        projectId: z.string().uuid().optional(),
    }, async ({ question, answer, title, projectId }) => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const docTitle = title?.trim() || question.trim().slice(0, 80);
        const res = await client.addFaq(pid, docTitle, question, answer);
        return textResult({
            projectId: pid,
            documentId: res.document.id,
            title: res.document.title,
            status: res.document.status,
            message: "FAQ queued for ingest. It will be searchable after the worker processes it (~30s).",
        });
    });
    server.tool("list_projects", "List QuickStart AI projects for the connected account (useful to find projectId).", {}, async () => {
        const client = getClient();
        const res = await client.listProjects();
        return textResult({ projects: res.projects });
    });
    server.tool("list_conversations", "List recent visitor chat conversations for a QuickStart AI project (excludes admin test sessions).", {
        projectId: z.string().uuid().optional().describe("Project ID; defaults to your primary project"),
        limit: z
            .number()
            .int()
            .min(1)
            .max(100)
            .optional()
            .describe("Max conversations to return (default 100)"),
    }, async ({ projectId, limit }) => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.listSessions(pid, limit);
        return textResult({
            projectId: pid,
            count: res.sessions.length,
            conversations: res.sessions,
        });
    });
    server.tool("get_conversation", "Get a full visitor conversation with all messages by session ID.", {
        sessionId: z.string().min(1).describe("Conversation session ID from list_conversations or search_conversations"),
        projectId: z.string().uuid().optional().describe("Project ID; defaults to your primary project"),
    }, async ({ sessionId, projectId }) => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.getSession(pid, sessionId);
        return textResult({ projectId: pid, conversation: res.session });
    });
    server.tool("search_conversations", "Search visitor conversations by visitor name, email, or message content.", {
        query: z.string().min(1).max(500).describe("Search text (name, email, or message content)"),
        projectId: z.string().uuid().optional().describe("Project ID; defaults to your primary project"),
        limit: z
            .number()
            .int()
            .min(1)
            .max(100)
            .optional()
            .describe("Max results (default 50)"),
    }, async ({ query, projectId, limit }) => {
        const client = getClient();
        const pid = projectId ?? (await client.resolveProjectId());
        const res = await client.searchSessions(pid, query, limit);
        return textResult({
            projectId: pid,
            query: res.query,
            count: res.sessions.length,
            conversations: res.sessions,
        });
    });
}
export function createMcpServer(getClient) {
    const server = new McpServerImpl({ name: "quickstart-ai", version: "0.1.0" });
    registerQuickStartTools(server, getClient);
    return server;
}
//# sourceMappingURL=tools.js.map