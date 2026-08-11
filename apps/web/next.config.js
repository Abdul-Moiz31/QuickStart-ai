/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@quickstart-ai/shared",
    "@quickstart-ai/widget-core",
    "@quickstart-ai/widget-react",
  ],
  reactStrictMode: true,
};

module.exports = nextConfig;
