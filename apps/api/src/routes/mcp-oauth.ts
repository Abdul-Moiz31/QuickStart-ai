import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@quickstart-ai/db";
import { requireAuth } from "../auth.js";
import { requireProjectAccess } from "../project-access.js";
import { env } from "../env.js";
import {
  MCP_SCOPES,
  createAuthorizationCode,
  exchangeAuthorizationCode,
  getOAuthClient,
  refreshOAuthToken,
  registerOAuthClient,
} from "../mcp/oauth-store.js";

const issuerUrl = () => env.publicApiUrl.replace(/\/$/, "");
const mcpResourceUrl = () => `${issuerUrl()}/mcp`;

function protectedResourceMetadata() {
  const base = issuerUrl();
  return {
    resource: mcpResourceUrl(),
    authorization_servers: [base],
    scopes_supported: [...MCP_SCOPES],
    bearer_methods_supported: ["header"],
  };
}

function parseOAuthBody(body: unknown) {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  return {};
}

const tokenBodySchema = z.object({
  grant_type: z.enum(["authorization_code", "refresh_token"]),
  code: z.string().optional(),
  redirect_uri: z.string().optional(),
  client_id: z.string(),
  code_verifier: z.string().optional(),
  refresh_token: z.string().optional(),
});

export async function mcpOAuthRoutes(app: FastifyInstance) {
  app.get("/.well-known/oauth-authorization-server", async () => {
    const base = issuerUrl();
    return {
      issuer: base,
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/oauth/token`,
      registration_endpoint: `${base}/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: [...MCP_SCOPES],
      token_endpoint_auth_methods_supported: ["none"],
    };
  });

  app.get("/.well-known/oauth-protected-resource", async () => protectedResourceMetadata());

  app.get("/.well-known/oauth-protected-resource/mcp", async () => protectedResourceMetadata());

  app.get("/mcp/setup", async () => ({
    mcpUrl: mcpResourceUrl(),
    publicApiUrl: issuerUrl(),
    webAppUrl: env.webAppUrl.replace(/\/$/, ""),
    oauthMetadata: `${issuerUrl()}/.well-known/oauth-authorization-server`,
    usingLocalhost: issuerUrl().includes("localhost") || issuerUrl().includes("127.0.0.1"),
    hint: issuerUrl().includes("localhost")
      ? "Restart API with .env.tunnel after pnpm mcp:tunnel so ChatGPT gets public HTTPS URLs."
      : "Ready for ChatGPT connector.",
  }));

  app.post("/oauth/register", async (req, reply) => {
    const raw = parseOAuthBody(req.body);
    const body = z
      .object({
        redirect_uris: z.array(z.string().url()).min(1),
        client_name: z.string().optional(),
        token_endpoint_auth_method: z.string().optional(),
      })
      .parse(raw);

    const client = await registerOAuthClient({
      redirectUris: body.redirect_uris,
      clientName: body.client_name,
      tokenEndpointAuthMethod: body.token_endpoint_auth_method,
    });
    return reply.status(201).send(client);
  });

  app.get("/oauth/authorize", async (req, reply) => {
    const q = z
      .object({
        client_id: z.string(),
        redirect_uri: z.string().url(),
        response_type: z.string().optional(),
        code_challenge: z.string(),
        code_challenge_method: z.string().optional(),
        state: z.string().optional(),
        scope: z.string().optional(),
        resource: z.string().optional(),
      })
      .parse(req.query);

    const client = await getOAuthClient(q.client_id);
    if (!client || !client.redirectUris.includes(q.redirect_uri)) {
      return reply.status(400).send({ error: "invalid_client" });
    }

    const params = new URLSearchParams({
      client_id: q.client_id,
      redirect_uri: q.redirect_uri,
      code_challenge: q.code_challenge,
      code_challenge_method: q.code_challenge_method ?? "S256",
      response_type: q.response_type ?? "code",
    });
    if (q.state) params.set("state", q.state);
    if (q.scope) params.set("scope", q.scope);
    if (q.resource) params.set("resource", q.resource);
    params.set("client_name", client.clientName ?? "MCP Client");

    const webUrl = `${env.webAppUrl.replace(/\/$/, "")}/oauth/authorize?${params.toString()}`;
    return reply.redirect(webUrl);
  });

  app.post("/oauth/approve", async (req) => {
    await requireAuth(req);
    const user = req.user!;
    const body = z
      .object({
        client_id: z.string(),
        redirect_uri: z.string().url(),
        code_challenge: z.string(),
        state: z.string().optional(),
        scope: z.string().optional(),
        project_id: z.string().uuid(),
      })
      .parse(req.body);

    const client = await getOAuthClient(body.client_id);
    if (!client || !client.redirectUris.includes(body.redirect_uri)) {
      return { success: false, message: "Invalid client or redirect URI" };
    }

    const access = await requireProjectAccess(body.project_id, user.id, { minRole: "admin" });
    const project = access.project;

    const scopes = body.scope?.split(" ").filter(Boolean) ?? [...MCP_SCOPES];
    const code = await createAuthorizationCode({
      clientId: body.client_id,
      userId: user.id,
      projectId: project.id,
      codeChallenge: body.code_challenge,
      redirectUri: body.redirect_uri,
      scopes,
    });

    const redirect = new URL(body.redirect_uri);
    redirect.searchParams.set("code", code);
    if (body.state) redirect.searchParams.set("state", body.state);

    return { success: true, redirectUrl: redirect.toString() };
  });

  app.post("/oauth/token", async (req, reply) => {
    let body: z.infer<typeof tokenBodySchema>;
    try {
      body = tokenBodySchema.parse(parseOAuthBody(req.body));
    } catch (err) {
      req.log.warn({ err, body: req.body }, "oauth/token parse failed");
      return reply.status(400).send({
        error: "invalid_request",
        error_description: "Malformed token request",
      });
    }

    try {
      if (body.grant_type === "authorization_code") {
        if (!body.code) {
          return reply.status(400).send({ error: "invalid_request", error_description: "code required" });
        }
        const tokens = await exchangeAuthorizationCode({
          code: body.code,
          clientId: body.client_id,
          redirectUri: body.redirect_uri,
          codeVerifier: body.code_verifier,
        });
        return tokens;
      }

      if (!body.refresh_token) {
        return reply.status(400).send({ error: "invalid_request", error_description: "refresh_token required" });
      }
      const tokens = await refreshOAuthToken({
        refreshToken: body.refresh_token,
        clientId: body.client_id,
      });
      return tokens;
    } catch (err) {
      req.log.warn({ err }, "oauth/token exchange failed");
      return reply.status(400).send({
        error: "invalid_grant",
        error_description: err instanceof Error ? err.message : "Token exchange failed",
      });
    }
  });
}
