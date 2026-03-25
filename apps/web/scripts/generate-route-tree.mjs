import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Generator, getConfig } from "@tanstack/router-generator";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const config = getConfig(
  {
    target: "react",
    routesDirectory: "./src/routes",
    generatedRouteTree: "./src/routeTree.gen.ts",
    routeFileIgnorePattern: String.raw`(^|/)\S+\.test\.(ts|tsx)$`,
    disableLogging: true,
  },
  root
);

await new Generator({ config, root }).run();
