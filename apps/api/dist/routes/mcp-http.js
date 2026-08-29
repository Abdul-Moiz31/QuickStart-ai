import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { QuickStartApiClient } from "@quickstart-ai/mcp-server/api-client";
import { createMcpServer } from "@quickstart-ai/mcp-server/tools";
import jwt from "jsonwebtoken";
import { verifyOAuthAccessToken } from "../mcp/oauth-store.js";
import { env } from "../env.js";
function jwtForUser(userId) {
    return jwt.sign({ sub: userId, email: "mcp@oauth", role: "USER" }, env.jwtSecret, {
        expiresIn: "1h",
    });
}
export async function mcpHttpRoutes(app) {
    const handleMcp = async (req, reply) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            reply.raw.statusCode = 401;
            reply.raw.setHeader("Content-Type", "application/json");
            reply.raw.end(JSON.stringify({
                jsonrpc: "2.0",
                error: { code: -32000, message: "Missing bearer token" },
                id: null,
            }));
            return;
        }
        let row;
        try {
            row = await verifyOAuthAccessToken(authHeader.slice(7));
        }
        catch (err) {
            reply.raw.statusCode = 401;
            reply.raw.setHeader("Content-Type", "application/json");
            reply.raw.end(JSON.stringify({
                jsonrpc: "2.0",
                error: {
                    code: -32000,
                    message: err instanceof Error ? err.message : "Unauthorized",
                },
                id: null,
            }));
            return;
        }
        const getClient = () => new QuickStartApiClient({
            apiUrl: env.publicApiUrl.replace(/\/$/, ""),
            token: jwtForUser(row.userId),
            projectId: row.projectId,
        });
        const server = createMcpServer(getClient);
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        try {
            await server.connect(transport);
            const body = req.method === "POST" ? req.body : undefined;
            await transport.handleRequest(req.raw, reply.raw, body);
            reply.raw.on("close", () => {
                transport.close();
                server.close();
            });
        }
        catch (err) {
            req.log.error({ err }, "MCP request failed");
            if (!reply.raw.headersSent) {
                reply.raw.statusCode = 500;
                reply.raw.setHeader("Content-Type", "application/json");
                reply.raw.end(JSON.stringify({
                    jsonrpc: "2.0",
                    error: { code: -32603, message: "Internal server error" },
                    id: null,
                }));
            }
        }
    };
    app.post("/mcp", handleMcp);
    app.get("/mcp", handleMcp);
    app.delete("/mcp", handleMcp);
}
//# sourceMappingURL=mcp-http.js.map