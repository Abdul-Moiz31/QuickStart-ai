/** @type {import('next').NextConfig} */
const path = require("path");

const repoRoot = path.join(__dirname, "../..");

// Monorepo: single root `.env` for local dev; production injects vars via the host (e.g. Vercel).
const nextDir = path.dirname(require.resolve("next/package.json"));
const { loadEnvConfig } = require(require.resolve("@next/env", { paths: [nextDir] }));
loadEnvConfig(repoRoot);

const nextConfig = {
  // Ensure root `.env` values reach the client bundle (pnpm monorepo dev + Vercel build).
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_DEMO_CLIENT_ID: process.env.NEXT_PUBLIC_DEMO_CLIENT_ID,
  },
  transpilePackages: [
    "@quickstart-ai/shared",
    "@quickstart-ai/widget-core",
    "@quickstart-ai/widget-react",
  ],
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

module.exports = nextConfig;
