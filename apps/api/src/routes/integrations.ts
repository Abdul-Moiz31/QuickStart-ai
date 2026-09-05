import type { FastifyInstance } from "fastify";
import { prisma } from "@quickstart-ai/db";
import { MCP_TOOL_CATALOG, MCP_TOOL_GROUPS, NotFoundError } from "@quickstart-ai/shared";
import { requireAuth } from "../auth.js";
import { requireProjectAccess } from "../project-access.js";
import { env } from "../env.js";

export async function integrationsRoutes(app: FastifyInstance) {
  app.get("/api/v1/projects/:id/mcp", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProjectAccess(id, req.user!.id, { minRole: "admin" });
    const project = await prisma.project.findFirst({
      where: { id },
      select: { id: true, name: true },
    });
    if (!project) throw new NotFoundError("Project not found");

    return {
      success: true,
      mcp: {
        apiUrl: env.publicApiUrl,
        remoteMcpUrl: `${env.publicApiUrl.replace(/\/$/, "")}/mcp`,
        oauthMetadataUrl: `${env.publicApiUrl.replace(/\/$/, "")}/.well-known/oauth-authorization-server`,
        projectId: project.id,
        projectName: project.name,
        tokenExpiresIn: env.jwtExpiresIn,
        server: {
          name: "quickstart-ai",
          package: "@quickstart-ai/mcp-server",
          npmScript: "pnpm mcp",
          command: "node",
          entryRelative: "packages/mcp-server/dist/index.js",
        },
        envVars: {
          QUICKSTART_API_URL: env.publicApiUrl,
          QUICKSTART_API_TOKEN: "<your-access-token>",
          QUICKSTART_PROJECT_ID: project.id,
        },
        tools: MCP_TOOL_CATALOG,
        toolGroups: MCP_TOOL_GROUPS,
      },
    };
  });
}
