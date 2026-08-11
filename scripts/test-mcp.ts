#!/usr/bin/env tsx
/**
 * Smoke-test MCP OAuth metadata on a public/tunneled API base URL.
 *
 * Usage: pnpm mcp:test
 *        pnpm mcp:test https://your-subdomain.trycloudflare.com
 */
const base = (process.argv[2] ?? process.env.PUBLIC_API_URL ?? "http://localhost:3100").replace(
  /\/$/,
  "",
);

async function check(path: string, label: string) {
  const url = `${base}${path}`;
  const res = await fetch(url);
  const body = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    json = body.slice(0, 200);
  }
  const ok = res.ok;
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  console.log(`  ${url}`);
  if (!ok) {
    console.log(`  HTTP ${res.status}:`, json);
    return false;
  }
  console.log(`  `, JSON.stringify(json).slice(0, 120) + "…");
  return true;
}

async function main() {
  console.log(`Testing MCP endpoints at ${base}\n`);
  const results = await Promise.all([
    check("/health", "Health"),
    check("/.well-known/oauth-authorization-server", "OAuth metadata"),
    check("/.well-known/oauth-protected-resource", "Protected resource metadata"),
  ]);
  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed < results.length) process.exit(1);
  console.log(`\nChatGPT MCP URL: ${base}/mcp`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
