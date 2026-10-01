import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["legacy/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@fisamtech/payments": path.resolve(__dirname, "packages/payments/src/index.ts"),
      "@fisamtech/payments/server": path.resolve(__dirname, "packages/payments/src/server/index.ts"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});
