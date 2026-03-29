# AGENTS.md

Project notes for future agents working in `base-template`.

## Project

- Name: `base-template`
- Repo type: `pnpm` workspace monorepo with `Turborepo`
- Product: Full-stack template with web, API, and mobile apps

## Tech Stack

### Styling (Web)

- **Tailwind CSS v4**: Latest version with CSS-based configuration
- **shadcn/ui**: Headless UI components with Tailwind styling
- **CSS Variables**: Theme tokens defined in `@base-template/ui`

## Hosting & Deployment

### URLs

- **Web**: https://offline.sumisura.ca (Vercel)
- **API**: https://base-templateapi-production.up.railway.app (Railway)
- **PowerSync**: https://powersync-production-f614.up.railway.app (self-hosted on Railway via `journeyapps/powersync-service` container)
- **Database**: PostgreSQL on Railway (shared by API and PowerSync)

### Architecture

```
[Web - Vercel]  ──fetch──▸  [API - Railway]  ──Drizzle──▸  [PostgreSQL - Railway]
                                  │                                  ▲
                                  │ issues JWT                       │ WAL replication
                                  ▼                                  │
                            [PowerSync - Railway] ──────────────────-┘
                                  ▲
                                  │ sync (WebSocket)
                            [Web / Mobile clients]
```

- **API** serves REST endpoints, auth (better-auth with session cookies), and issues PowerSync JWTs at `POST /api/powersync/token`
- **PowerSync** connects to Postgres via WAL for real-time change detection, uses Sync Streams (edition 3) for row-level security
- **Config**: PowerSync uses `POWERSYNC_CONFIG_B64` env var (base64-encoded YAML) — source file at `powersync_config.b64`
- **Auth flow**: Web/mobile clients get a JWT from the API, then use it to authenticate with PowerSync for sync
- **Cross-origin cookies**: API must be on a subdomain of `sumisura.ca` (e.g. `api.sumisura.ca`) for session cookies to work with the web app. Better-Auth is configured with `crossSubDomainCookies` using the shared parent domain.
- **Health checks**: PowerSync readiness probe is at `GET /probes/startup` on port 80. Set `PORT=80` in Railway for the PowerSync service.

## Apps

- `apps/web`: TanStack Start frontend on Vite + Nitro + Tailwind CSS v4 + shadcn/ui
- `apps/api`: Node.js HTTP server with better-auth + Drizzle + Effect TS
- `apps/mobile`: Expo app with Expo Router

## Shared Packages

- `packages/contracts`: shared Effect schemas/contracts (auth + RBAC)
- `packages/api-client`: shared typed client wrapper (auth)
- `packages/ui`: shared tokens, theme variables, and shadcn component registry

## Verified Commands

These were verified successfully in this repo:

- `pnpm install`
- `pnpm typecheck`
- `pnpm build`
- `pnpm --filter @base-template/web dev`
- `pnpm --filter @base-template/api dev`
- `pnpm --filter @base-template/mobile dev`
- `pnpm --filter @base-template/mobile build`

## Environment Setup

All apps require environment files to run locally:

- **API** (`apps/api/.env`): Requires `DATABASE_URL`, `BETTER_AUTH_SECRET`. See `.env.example`.
- **Web** (`apps/web/.env`): Requires `VITE_API_ORIGIN` (no Nitro proxy, direct API calls). See `.env.example`.
- **Mobile** (`apps/mobile/.env`): Requires `EXPO_PUBLIC_API_ORIGIN`. See `.env.example`.

You can copy values from the root `.env` file to each app's `.env` file:

```bash
# Copy from root to each app
cp .env apps/api/.env
cp .env apps/web/.env
cp .env apps/mobile/.env
```

## Important Setup Notes

- Web app uses `vite dev`/`vite build`, not a `tanstack-start` binary.
- TanStack route generation creates `apps/web/src/routeTree.gen.ts`.
- Web Vite config uses `@tanstack/react-start/plugin/vite` and `nitro/vite`.
- Mobile Babel config should only use `babel-preset-expo`; do not add `expo-router/babel` back.
- Mobile web export needs `react-native-web` and `@babel/runtime`.
- Buildable TS packages/apps that emit output must override the root `noEmit: true` setting.

## Current Commands By Package

- Root: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`
- Web: `pnpm --filter @base-template/web dev`
- API: `pnpm --filter @base-template/api dev`
- Mobile: `pnpm --filter @base-template/mobile dev`

## Setup Assumptions

- Use the repo-pinned package manager from `package.json`: `pnpm@10.6.3`.
- Assume a local Node.js version compatible with current workspace dependencies; do not change runtime/tooling versions unless explicitly requested.
- Prefer `pnpm --filter <package>` for package-scoped work instead of ad hoc scripts.
- Expo native commands may require local platform tooling; prefer `pnpm --filter @base-template/mobile build` and `pnpm --filter @base-template/mobile dev` unless native run commands are specifically needed.

## Verification Matrix

- For `apps/web` changes only: run `pnpm --filter @base-template/web typecheck` and `pnpm --filter @base-template/web build`.
- For `apps/api` changes only: run `pnpm --filter @base-template/api typecheck` and `pnpm --filter @base-template/api build`.
- For `apps/mobile` changes only: run `pnpm --filter @base-template/mobile typecheck` and `pnpm --filter @base-template/mobile build`.
- For shared package changes in `packages/*`: run `pnpm typecheck` and `pnpm build`.
- For cross-app contract/client changes: run `pnpm typecheck` and `pnpm build`.
- Run narrower verification first while iterating; run root verification before claiming broad workspace changes are complete.

## Vendored Reference Repos

- `/Users/tim/work/tanstack-db/examples` — TanStack DB example apps demonstrating offline-first patterns, sync adapters, optimistic mutations, and live queries. Use as reference when building offline-first features.
- `vendor/effect/` — Effect TS monorepo, added as a **git subtree** (`--squash`) for agent reference.
- Contains source code, patterns, and `AGENTS.md` with Effect's own coding conventions.
- **Read-only**: Do not edit files in `vendor/`. It is excluded from pnpm workspace, tsconfig, and Turbo.
- **To update**: `git subtree pull --prefix=vendor/effect https://github.com/Effect-TS/effect.git main --squash`
- **Key paths for reference**:
  - `vendor/effect/packages/effect/src/` — core Effect library
  - `vendor/effect/packages/platform/src/` — platform abstractions
  - `vendor/effect/packages/sql/src/` — SQL integration
  - `vendor/effect/packages/schema/src/` — schema/validation
  - `vendor/effect/AGENTS.md` — Effect project conventions

## Generated And Protected Files

- Do not hand-edit `apps/web/src/routeTree.gen.ts`; it is generated by TanStack route generation.
- Do not commit or rely on build outputs under `dist/`, `.output/`, `web-build/`, `coverage/`, `.turbo/`, or Expo local state under `apps/mobile/.expo/`.
- Prefer editing source files under `apps/*/src` and `packages/*/src`; treat generated artifacts as disposable.

## Working Conventions

- Prefer small vertical slices across API + shared contracts + clients + UI.
- Keep infrastructure concerns inside apps; keep shared packages mostly pure.
- Follow existing starter style: simple, explicit, minimal abstraction.
- Components created for the app should live in their own file; avoid defining non-trivial app UI components inline in route files.
- Do not modify third-party or vendored dependency code. It is fine to inspect dependency source for debugging, but fixes should go in app/package source unless the task explicitly asks for patching external code.
- Keep responses and actions minimal by default; only invoke broader workflow skills (maintenance, tdd, etc.) when the task clearly requires them.
- If a request is explicitly broad/diagnostic, state that scope first; otherwise prefer small, direct edits + targeted verification for the requested task.

## Repo Exploration Heuristics

- Start from `package.json` scripts and nearby source files before introducing new commands or tools.
- Find 2-3 similar implementations in the same app/package and match their conventions.
- Prefer workspace package imports (`@base-template/*`) and existing TS path aliases over relative cross-package imports.
- Avoid introducing new tooling, config files, or architectural layers unless the task clearly requires them.

## Common Pitfalls

- Web app uses `vite dev` and `vite build`; do not swap in a `tanstack-start` CLI.
- Mobile Babel config should only use `babel-preset-expo`; do not add `expo-router/babel` back.
- Mobile web export needs `react-native-web` and `@babel/runtime`.
- Buildable TS packages/apps that emit output must override the root `noEmit: true` setting.
- Follow existing starter style: simple, explicit, minimal abstraction.

## Testing Reality

- Current `lint` scripts are TypeScript checks, not a separate linter; do not assume ESLint, Biome, or Prettier are configured.
- Current `test` scripts use `node --test` as a lightweight default; inspect package tests before assuming meaningful coverage exists.
- When adding behavior, prefer adding focused tests where the package already has a clear pattern; if no test pattern exists, rely on typecheck/build verification and keep changes small.

<!-- intent-skills:start -->

# Skill mappings - when working in these areas, load the linked skill file into context.

skills:

- task: "Adding or editing routes"
  load: "node_modules/.pnpm/@tanstack+router-core@1.168.4/node_modules/@tanstack/router-core/skills/router-core/SKILL.md"

- task: "Auth guards and protected routes"
  load: "node_modules/.pnpm/@tanstack+router-core@1.168.4/node_modules/@tanstack/router-core/skills/router-core/auth-and-guards/SKILL.md"

- task: "Server functions and SSR"
  load: "node_modules/.pnpm/@tanstack+start-client-core@1.167.4/node_modules/@tanstack/start-client-core/skills/start-core/SKILL.md"

- task: "Adding new API endpoints"
  load: "node_modules/.pnpm/@tanstack+start-client-core@1.167.4/node_modules/@tanstack/start-client-core/skills/start-core/server-routes/SKILL.md"

- task: "Error handling and not-found pages"
  load: "node_modules/.pnpm/@tanstack+router-core@1.168.4/node_modules/@tanstack/router-core/skills/router-core/not-found-and-errors/SKILL.md"

- task: "Configuring the router plugin or code splitting"
  load: "node*modules/.pnpm/@tanstack+router-plugin@1.167.5*@tanstack+react-router@1.168.4_react-dom@19.2.4_react@1_175b164fd3ea834698da6898e7b3d973/node_modules/@tanstack/router-plugin/skills/router-plugin/SKILL.md"

- task: "Setting up TanStack DB collections"
  load: "apps/web/node_modules/@tanstack/db/skills/db-core/SKILL.md"

- task: "Configuring collection adapters (Electric, PowerSync, RxDB, Query, etc.)"
  load: "apps/web/node_modules/@tanstack/db/skills/db-core/collection-setup/SKILL.md"

- task: "Building live queries with TanStack DB"
  load: "apps/web/node_modules/@tanstack/db/skills/db-core/live-queries/SKILL.md"

- task: "Optimistic mutations and transactions with TanStack DB"
  load: "apps/web/node_modules/@tanstack/db/skills/db-core/mutations-optimistic/SKILL.md"

- task: "Building a custom TanStack DB adapter"
  load: "apps/web/node_modules/@tanstack/db/skills/db-core/custom-adapter/SKILL.md"

- task: "Integrating TanStack DB with TanStack Start (SSR, preloading)"
load: "apps/web/node_modules/@tanstack/db/skills/meta-framework/SKILL.md"
<!-- intent-skills:end -->
