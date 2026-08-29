import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@quickstart-ai/db";
export const MCP_SCOPES = ["mcp:tools", "project:read", "knowledge:write"];
function sha256(value) {
    return createHash("sha256").update(value).digest("hex");
}
function safeEqual(a, b) {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length)
        return false;
    return timingSafeEqual(ab, bb);
}
export function hashToken(token) {
    return sha256(token);
}
export function generateToken() {
    return randomBytes(32).toString("base64url");
}
export function verifyPkce(codeVerifier, codeChallenge) {
    const digest = createHash("sha256").update(codeVerifier).digest("base64url");
    return safeEqual(digest, codeChallenge);
}
export async function registerOAuthClient(input) {
    const clientId = `qs_${randomBytes(12).toString("hex")}`;
    const client = await prisma.oAuthClient.create({
        data: {
            clientId,
            redirectUris: input.redirectUris,
            clientName: input.clientName ?? "MCP Client",
            tokenEndpointAuthMethod: input.tokenEndpointAuthMethod ?? "none",
        },
    });
    return {
        client_id: client.clientId,
        client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
        redirect_uris: client.redirectUris,
        client_name: client.clientName,
        grant_types: client.grantTypes,
        token_endpoint_auth_method: client.tokenEndpointAuthMethod,
    };
}
export async function getOAuthClient(clientId) {
    return prisma.oAuthClient.findUnique({ where: { clientId } });
}
export async function createAuthorizationCode(input) {
    const code = generateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.oAuthAuthorizationCode.create({
        data: {
            code,
            clientId: input.clientId,
            userId: input.userId,
            projectId: input.projectId,
            codeChallenge: input.codeChallenge,
            redirectUri: input.redirectUri,
            scopes: input.scopes,
            expiresAt,
        },
    });
    return code;
}
export async function exchangeAuthorizationCode(input) {
    const row = await prisma.oAuthAuthorizationCode.findUnique({ where: { code: input.code } });
    if (!row || row.expiresAt < new Date()) {
        throw new Error("Invalid or expired authorization code");
    }
    if (row.clientId !== input.clientId) {
        throw new Error("Authorization code was not issued to this client");
    }
    if (input.redirectUri && row.redirectUri !== input.redirectUri) {
        throw new Error("Redirect URI mismatch");
    }
    if (!input.codeVerifier || !verifyPkce(input.codeVerifier, row.codeChallenge)) {
        throw new Error("Invalid PKCE code verifier");
    }
    await prisma.oAuthAuthorizationCode.delete({ where: { code: input.code } });
    const accessToken = generateToken();
    const refreshToken = generateToken();
    const expiresAt = new Date(Date.now() + 3600 * 1000);
    await prisma.oAuthAccessToken.create({
        data: {
            tokenHash: hashToken(accessToken),
            refreshHash: hashToken(refreshToken),
            clientId: row.clientId,
            userId: row.userId,
            projectId: row.projectId,
            scopes: row.scopes,
            expiresAt,
        },
    });
    return {
        access_token: accessToken,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: refreshToken,
        scope: row.scopes.join(" "),
    };
}
export async function verifyOAuthAccessToken(token) {
    const row = await prisma.oAuthAccessToken.findUnique({
        where: { tokenHash: hashToken(token) },
    });
    if (!row || row.expiresAt < new Date()) {
        throw new Error("Invalid or expired access token");
    }
    return row;
}
export async function refreshOAuthToken(input) {
    const row = await prisma.oAuthAccessToken.findUnique({
        where: { refreshHash: hashToken(input.refreshToken) },
    });
    if (!row || row.clientId !== input.clientId) {
        throw new Error("Invalid refresh token");
    }
    const accessToken = generateToken();
    const refreshToken = generateToken();
    const expiresAt = new Date(Date.now() + 3600 * 1000);
    await prisma.oAuthAccessToken.update({
        where: { id: row.id },
        data: {
            tokenHash: hashToken(accessToken),
            refreshHash: hashToken(refreshToken),
            expiresAt,
        },
    });
    return {
        access_token: accessToken,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: refreshToken,
        scope: row.scopes.join(" "),
    };
}
//# sourceMappingURL=oauth-store.js.map