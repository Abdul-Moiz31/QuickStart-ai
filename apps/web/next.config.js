/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  transpilePackages: [
    "@quickstart-ai/shared",
    "@quickstart-ai/widget-core",
    "@quickstart-ai/widget-react",
  ],
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

module.exports = nextConfig;
