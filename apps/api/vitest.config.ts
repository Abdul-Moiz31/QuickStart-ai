import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // env.ts crashes at import time if JWT_SECRET is left at its insecure
    // default — set a harmless one so importing any route module in tests
    // doesn't require a real .env file.
    env: {
      JWT_SECRET: "test-secret-not-for-production-use",
    },
  },
});
