import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load env from apps/web/.env explicitly
  const cwd = process.cwd();
  loadEnv(mode, cwd, "");

  return {
    resolve: {
      tsconfigPaths: true,
    },
    // Explicitly set env directory to load from apps/web/.env
    envDir: ".",
    plugins: [
      tailwindcss(),
      tanstackStart({
        srcDirectory: "src",
        router: {
          routeFileIgnorePattern: "(^|/)\\S+\\.test\\.(ts|tsx)$",
        },
      }),
      react(),
      nitro(),
    ],
  };
});
