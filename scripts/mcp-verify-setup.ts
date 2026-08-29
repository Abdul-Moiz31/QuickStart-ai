#!/usr/bin/env tsx
/**
 * Verify MCP + tunnel setup before connecting ChatGPT.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const tunnelEnvPath = resolve(root, ".env.tunnel");

function loadTunnelApiUrl(): string | null {
  if (!existsSync(tunnelEnvPath)) return null;
  const text = readFileSync(tunnelEnvPath, "utf8");
  const m = text.match(/^PUBLIC_API_URL=(.+)$/m);
  return m?.[1]?.trim() ?? null;
}

async function check(label: string, url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    const body = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch {
      json = body.slice(0, 120);
    }
    const ok = res.ok;
    console.log(`${ok ? "✓" : "✗"} ${label}`);
    console.log(`  ${url}`);
    if (!ok) console.log(`  HTTP ${res.status}:`, json);
    return { ok, json };
  } catch (err) {
    console.log(`✗ ${label}`);
    console.log(`  ${url}`);
    console.log(`  ${err instanceof Error ? err.message : err}`);
    return { ok: false, json: null };
  }
}

async function main() {
  const tunnelApi = loadTunnelApiUrl();
  const localApi = "http://localhost:3100";

  console.log("QuickStart MCP setup check\n");

  const localMeta = await check(
    "Local API OAuth metadata",
    `${localApi}/.well-known/oauth-authorization-server`,
  );
  const localSetup = await check("Local API MCP setup", `${localApi}/mcp/setup`);

  if (localMeta.ok && localMeta.json && typeof localMeta.json === "object") {
    const issuer = (localMeta.json as { issuer?: string }).issuer ?? "";
    if (issuer.includes("localhost")) {
      console.log("\n⚠  API is still advertising localhost URLs.");
      console.log("   ChatGPT cannot use these. Restart API with .env.tunnel after pnpm mcp:tunnel.");
    }
  }

  if (tunnelApi) {
    console.log(`\nTunnel URL from .env.tunnel: ${tunnelApi}`);
    const tunMeta = await check(
      "Tunneled API OAuth metadata",
      `${tunnelApi}/.well-known/oauth-authorization-server`,
    );
    const tunSetup = await check("Tunneled API MCP setup", `${tunnelApi}/mcp/setup`);

    if (tunMeta.ok && tunSetup.ok) {
      console.log(`\n✓ ChatGPT MCP URL: ${tunnelApi}/mcp`);
    } else {
      console.log("\n✗ Tunnel URL is not reachable.");
      console.log("  → Is `pnpm mcp:tunnel` still running? Restart it and use the NEW URLs.");
    }
  } else {
    console.log("\nNo .env.tunnel found. Run: pnpm mcp:tunnel");
  }

  console.log("\nRestart checklist (after tunnel is up):");
  console.log("  1. dotenv -e .env -e .env.tunnel -o -- pnpm --filter @quickstart-ai/api dev");
  console.log("  2. dotenv -e .env -e .env.tunnel -o -- pnpm --filter @quickstart-ai/web dev");
  console.log("  3. ChatGPT connector URL = https://YOUR-TUNNEL.trycloudflare.com/mcp");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
