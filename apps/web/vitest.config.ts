import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const reactPlugin = react();

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [reactPlugin],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: false,
    setupFiles: ["./src/test/setup.ts"],
  },
});
