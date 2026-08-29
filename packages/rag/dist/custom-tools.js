import { CUSTOM_TOOL_LIMITS } from "@quickstart-ai/shared";
import { decryptSecret } from "@quickstart-ai/shared/secrets";
import { Redis } from "ioredis";
export function formatCustomToolDescription(tool) {
    if (!tool.parameters.length)
        return tool.description;
    const paramHints = tool.parameters
        .map((p) => `${p.name}${p.required !== false ? " (required)" : " (optional)"}: ${p.description}`)
        .join("; ");
    return `${tool.description} Parameters: ${paramHints}`;
}
function extractResponseValue(data, responseKey) {
    if (responseKey && data && typeof data === "object" && !Array.isArray(data)) {
        const val = data[responseKey];
        if (val !== undefined && val !== null)
            return String(val);
    }
    if (typeof data === "string")
        return data;
    try {
        return JSON.stringify(data);
    }
    catch {
        return String(data);
    }
}
const URL_PATH_PARAM = /\{([a-z][a-z0-9_]*)\}/g;
/** Replace `{product_id}`-style segments in the URL; leftover args go to query/body. */
export function applyUrlPathParams(urlTemplate, args) {
    const placeholders = [...urlTemplate.matchAll(URL_PATH_PARAM)].map((m) => m[1]);
    for (const key of placeholders) {
        const value = args[key];
        if (value === undefined || value === null || String(value).trim() === "") {
            return { error: `Lookup failed: missing URL parameter "${key}".` };
        }
    }
    const usedKeys = new Set();
    const url = urlTemplate.replace(URL_PATH_PARAM, (_, key) => {
        usedKeys.add(key);
        return encodeURIComponent(String(args[key]));
    });
    const remainingArgs = { ...args };
    for (const key of usedKeys)
        delete remainingArgs[key];
    return { url, remainingArgs };
}
function buildRequestUrl(baseUrl, args) {
    const url = new URL(baseUrl);
    for (const [key, value] of Object.entries(args)) {
        if (value === undefined || value === null)
            continue;
        url.searchParams.set(key, String(value));
    }
    return url.toString();
}
async function readCappedBody(res, maxBytes) {
    const reader = res.body?.getReader();
    if (!reader)
        return "";
    const chunks = [];
    let total = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done)
            break;
        if (!value)
            continue;
        total += value.byteLength;
        chunks.push(value);
        if (total >= maxBytes)
            break;
    }
    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    return buf.slice(0, maxBytes).toString("utf8");
}
async function checkCustomToolRateLimit(projectId, toolId, redisUrl) {
    if (!redisUrl)
        return true;
    const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
    try {
        await redis.connect();
        const key = `custom-tool:rate:${projectId}:${toolId}`;
        const count = await redis.incr(key);
        if (count === 1)
            await redis.expire(key, 60);
        return count <= CUSTOM_TOOL_LIMITS.callsPerMinutePerTool;
    }
    catch {
        if (process.env.NODE_ENV === "production")
            return false;
        return true;
    }
    finally {
        try {
            await redis.quit();
        }
        catch {
            /* ignore */
        }
    }
}
export async function executeCustomTool(tool, args, ctx) {
    if (ctx.applyRateLimit !== false && ctx.redisUrl) {
        const allowed = await checkCustomToolRateLimit(ctx.projectId, tool.id, ctx.redisUrl);
        if (!allowed) {
            return { output: "Lookup failed: rate limit exceeded for this tool. Try again shortly." };
        }
    }
    const method = tool.httpMethod.toUpperCase();
    const headers = {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
    };
    if (tool.authHeaderEnc) {
        try {
            headers.Authorization = decryptSecret(tool.authHeaderEnc);
        }
        catch {
            return { output: "Lookup failed: tool authentication is misconfigured." };
        }
    }
    let body;
    let url = tool.url;
    try {
        const resolved = applyUrlPathParams(tool.url, args);
        if ("error" in resolved) {
            return { output: resolved.error };
        }
        url = resolved.url;
        const requestArgs = resolved.remainingArgs;
        if (method === "GET") {
            url = buildRequestUrl(url, requestArgs);
        }
        else {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(requestArgs);
        }
        const res = await fetch(url, {
            method,
            headers,
            body,
            redirect: "manual",
            signal: AbortSignal.timeout(CUSTOM_TOOL_LIMITS.executionTimeoutMs),
        });
        const rawBody = await readCappedBody(res, CUSTOM_TOOL_LIMITS.maxResponseBytes);
        if (res.status >= 400) {
            return {
                output: `Lookup failed: remote API returned ${res.status}.`,
                statusCode: res.status,
                rawBody,
            };
        }
        let parsed = rawBody;
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json") && rawBody.trim()) {
            try {
                parsed = JSON.parse(rawBody);
            }
            catch {
                parsed = rawBody;
            }
        }
        return {
            output: extractResponseValue(parsed, tool.responseKey),
            statusCode: res.status,
            rawBody,
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "unknown error";
        const friendly = message.includes("timeout") || message.includes("aborted")
            ? "Lookup failed: the external service timed out."
            : `Lookup failed: ${message}`;
        return { output: friendly };
    }
}
//# sourceMappingURL=custom-tools.js.map