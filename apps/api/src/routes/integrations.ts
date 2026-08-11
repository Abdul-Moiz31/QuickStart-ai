import type { FastifyInstance } from "fastify";
import { prisma } from "@quickstart-ai/db";
import { NotFoundError } from "@quickstart-ai/shared";
import { requireAuth } from "../auth.js";
import { env } from "../env.js";

const MCP_TOOLS = [
  {
    name: "get_business_profile",
    description: "Read business name, industry, description, location, support email, and onboarding Q&A.",
  },
  {
    name: "save_business_profile",
    description: "Save or update business details — syncs your chatbot knowledge automatically.",
  },
  {
    name: "list_faqs",
    description: "List FAQ question/answer pairs the chatbot uses.",
  },
  {
    name: "add_faq",
    description: "Add a new FAQ to the chatbot knowledge base.",
  },
  {
    name: "list_projects",
    description: "List your QuickStart AI projects.",
  },
  {
    name: "list_conversations",
    description: "List recent visitor chat conversations (excludes admin test sessions).",
  },
  {
    name: "get_conversation",
    description: "Get a full conversation with all messages by session ID.",
  },
  {
    name: "search_conversations",
    description: "Search conversations by visitor name, email, or message content.",
  },
] as const;

export async function integrationsRoutes(app: FastifyInstance) {
  app.get("/api/v1/projects/:id/mcp", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
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
        tools: MCP_TOOLS,
      },
    };
  });
}
