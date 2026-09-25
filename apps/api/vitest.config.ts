import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 60000,
    hookTimeout: 180000,
    fileParallelism: false,
    env: {
      DATABASE_URL: "mysql://jam:jampass@localhost:3306/jam_test",
      JWT_SECRET: "test-secret",
      WEB_ORIGIN: "http://localhost:5173",
    },
  },
});
