import { prisma } from "@quickstart-ai/db";
import { assertPublicHttpsUrl } from "@quickstart-ai/events";
import { AppError, createCustomToolSchema, CUSTOM_TOOL_LIMITS, NotFoundError, testCustomToolSchema, updateCustomToolSchema, } from "@quickstart-ai/shared";
import { encryptSecret } from "@quickstart-ai/shared/secrets";
import { executeCustomTool } from "@quickstart-ai/rag";
import { requireAuth } from "../auth.js";
import { env } from "../env.js";
import { serializeCustomTool, toCustomToolRuntime } from "../custom-tools.js";
async function requireProject(projectId, ownerId) {
    const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId },
    });
    if (!project)
        throw new NotFoundError("Project not found");
    return project;
}
export async function customToolsRoutes(app) {
    app.get("/api/v1/projects/:id/custom-tools", async (req) => {
        await requireAuth(req);
        const { id } = req.params;
        await requireProject(id, req.user.id);
        const rows = await prisma.customTool.findMany({
            where: { projectId: id },
            orderBy: { createdAt: "desc" },
        });
        return { success: true, tools: rows.map(serializeCustomTool) };
    });
    app.post("/api/v1/projects/:id/custom-tools", async (req) => {
        await requireAuth(req);
        const { id } = req.params;
        await requireProject(id, req.user.id);
        const body = createCustomToolSchema.parse(req.body);
        assertPublicHttpsUrl(body.url);
        const count = await prisma.customTool.count({ where: { projectId: id } });
        if (count >= CUSTOM_TOOL_LIMITS.maxPerProject) {
            throw new AppError(`Maximum ${CUSTOM_TOOL_LIMITS.maxPerProject} custom tools per project`, 403, "LIMIT_EXCEEDED");
        }
        const row = await prisma.customTool.create({
            data: {
                projectId: id,
                name: body.name,
                description: body.description,
                httpMethod: body.httpMethod,
                url: body.url,
                parameters: body.parameters,
                responseKey: body.responseKey ?? null,
                authHeaderEnc: body.authHeader?.trim() ? encryptSecret(body.authHeader.trim()) : null,
                enabled: body.enabled ?? true,
            },
        });
        return { success: true, tool: serializeCustomTool(row) };
    });
    app.patch("/api/v1/projects/:id/custom-tools/:tid", async (req) => {
        await requireAuth(req);
        const { id, tid } = req.params;
        await requireProject(id, req.user.id);
        const existing = await prisma.customTool.findFirst({
            where: { id: tid, projectId: id },
        });
        if (!existing)
            throw new NotFoundError("Custom tool not found");
        const body = updateCustomToolSchema.parse(req.body);
        if (body.url)
            assertPublicHttpsUrl(body.url);
        let authHeaderEnc = existing.authHeaderEnc;
        if (body.authHeader === null) {
            authHeaderEnc = null;
        }
        else if (typeof body.authHeader === "string" && body.authHeader.trim()) {
            authHeaderEnc = encryptSecret(body.authHeader.trim());
        }
        const row = await prisma.customTool.update({
            where: { id: tid },
            data: {
                name: body.name,
                description: body.description,
                httpMethod: body.httpMethod,
                url: body.url,
                parameters: body.parameters,
                responseKey: body.responseKey === undefined ? undefined : body.responseKey ?? null,
                authHeaderEnc,
                enabled: body.enabled,
            },
        });
        return { success: true, tool: serializeCustomTool(row) };
    });
    app.delete("/api/v1/projects/:id/custom-tools/:tid", async (req) => {
        await requireAuth(req);
        const { id, tid } = req.params;
        await requireProject(id, req.user.id);
        const existing = await prisma.customTool.findFirst({
            where: { id: tid, projectId: id },
        });
        if (!existing)
            throw new NotFoundError("Custom tool not found");
        await prisma.customTool.delete({ where: { id: tid } });
        return { success: true };
    });
    app.post("/api/v1/projects/:id/custom-tools/:tid/test", async (req) => {
        await requireAuth(req);
        const { id, tid } = req.params;
        await requireProject(id, req.user.id);
        const existing = await prisma.customTool.findFirst({
            where: { id: tid, projectId: id },
        });
        if (!existing)
            throw new NotFoundError("Custom tool not found");
        const body = testCustomToolSchema.parse(req.body ?? {});
        const runtime = toCustomToolRuntime(existing);
        const result = await executeCustomTool(runtime, body.args, {
            projectId: id,
            redisUrl: env.redisUrl,
            applyRateLimit: false,
        });
        return {
            success: true,
            statusCode: result.statusCode ?? null,
            output: result.output,
            rawBody: result.rawBody?.slice(0, CUSTOM_TOOL_LIMITS.maxResponseBytes) ?? null,
        };
    });
}
export async function loadEnabledCustomTools(projectId) {
    const rows = await prisma.customTool.findMany({
        where: { projectId, enabled: true },
        orderBy: { createdAt: "asc" },
    });
    return rows.map(toCustomToolRuntime);
}
//# sourceMappingURL=custom-tools.js.map