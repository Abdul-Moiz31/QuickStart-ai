import { CUSTOM_TOOL_LIMITS } from "@quickstart-ai/shared";
import { decryptSecret } from "@quickstart-ai/shared/secrets";
import { Redis } from "ioredis";

export interface CustomToolParameter {
  name: string;
  description: string;
  required?: boolean;
}

export interface CustomToolRuntime {
  id: string;
  projectId: string;
  name: string;
  description: string;
  httpMethod: string;
  url: string;
  authHeaderEnc?: string | null;
  parameters: CustomToolParameter[];
  responseKey?: string | null;
  enabled: boolean;
}

export interface CustomToolExecuteContext {
  projectId: string;
  redisUrl?: string;
  /** When false, skip rate limiting (dashboard test). */
  applyRateLimit?: boolean;
}

export interface CustomToolExecuteResult {
  output: string;
  statusCode?: number;
  rawBody?: string;
}

export function formatCustomToolDescription(tool: CustomToolRuntime): string {
  if (!tool.parameters.length) return tool.description;
  const paramHints = tool.parameters
    .map((p) => `${p.name}${p.required !== false ? " (required)" : " (optional)"}: ${p.description}`)
    .join("; ");
  return `${tool.description} Parameters: ${paramHints}`;
}

function extractResponseValue(data: unknown, responseKey?: string | null): string {
  if (responseKey && data && typeof data === "object" && !Array.isArray(data)) {
    const val = (data as Record<string, unknown>)[responseKey];
    if (val !== undefined && val !== null) return String(val);
  }
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

const URL_PATH_PARAM = /\{([a-z][a-z0-9_]*)\}/g;

/** Replace `{product_id}`-style segments in the URL; leftover args go to query/body. */
export function applyUrlPathParams(
  urlTemplate: string,
  args: Record<string, unknown>,
): { url: string; remainingArgs: Record<string, unknown> } | { error: string } {
  const placeholders = [...urlTemplate.matchAll(URL_PATH_PARAM)].map((m) => m[1]!);
  for (const key of placeholders) {
    const value = args[key];
    if (value === undefined || value === null || String(value).trim() === "") {
      return { error: `Lookup failed: missing URL parameter "${key}".` };
    }
  }

  const usedKeys = new Set<string>();
  const url = urlTemplate.replace(URL_PATH_PARAM, (_, key: string) => {
    usedKeys.add(key);
    return encodeURIComponent(String(args[key]));
  });

  const remainingArgs = { ...args };
  for (const key of usedKeys) delete remainingArgs[key];
  return { url, remainingArgs };
}

function buildRequestUrl(baseUrl: string, args: Record<string, unknown>): string {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function readCappedBody(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    chunks.push(value);
    if (total >= maxBytes) break;
  }
  const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  return buf.slice(0, maxBytes).toString("utf8");
}

async function checkCustomToolRateLimit(
  projectId: string,
  toolId: string,
  redisUrl: string | undefined,
): Promise<boolean> {
  if (!redisUrl) return true;
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
  try {
    await redis.connect();
    const key = `custom-tool:rate:${projectId}:${toolId}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);
    return count <= CUSTOM_TOOL_LIMITS.callsPerMinutePerTool;
  } catch {
    if (process.env.NODE_ENV === "production") return false;
    return true;
  } finally {
    try {
      await redis.quit();
    } catch {
      /* ignore */
    }
  }
}

export async function executeCustomTool(
  tool: CustomToolRuntime,
  args: Record<string, unknown>,
  ctx: CustomToolExecuteContext,
): Promise<CustomToolExecuteResult> {
  if (ctx.applyRateLimit !== false && ctx.redisUrl) {
    const allowed = await checkCustomToolRateLimit(ctx.projectId, tool.id, ctx.redisUrl);
    if (!allowed) {
      return { output: "Lookup failed: rate limit exceeded for this tool. Try again shortly." };
    }
  }

  const method = tool.httpMethod.toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
  };

  if (tool.authHeaderEnc) {
    try {
      headers.Authorization = decryptSecret(tool.authHeaderEnc);
    } catch {
      return { output: "Lookup failed: tool authentication is misconfigured." };
    }
  }

  let body: string | undefined;
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
    } else {
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

    let parsed: unknown = rawBody;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json") && rawBody.trim()) {
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        parsed = rawBody;
      }
    }

    return {
      output: extractResponseValue(parsed, tool.responseKey),
      statusCode: res.status,
      rawBody,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    const friendly =
      message.includes("timeout") || message.includes("aborted")
        ? "Lookup failed: the external service timed out."
        : `Lookup failed: ${message}`;
    return { output: friendly };
  }
}
