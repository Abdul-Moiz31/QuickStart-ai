#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { QuickStartApiClient, loadConfigFromEnv } from "./api-client.js";
import { registerQuickStartTools } from "./tools.js";
function getClient() {
    return new QuickStartApiClient(loadConfigFromEnv());
}
export function createQuickStartMcpServer() {
    const server = new McpServer({ name: "quickstart-ai", version: "0.1.0" });
    registerQuickStartTools(server, getClient);
    return server;
}
async function main() {
    const server = createQuickStartMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("QuickStart AI MCP server running (stdio)");
}
main().catch((err) => {
    console.error("MCP server failed:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map