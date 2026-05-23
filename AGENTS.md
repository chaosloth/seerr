# AGENTS.md

## Project Overview

Seerr is a media request management app built with **Next.js 16** (client) and **Express 5** (server), running in a single process. The server mounts the Next.js app as a fallback handler. Uses **TypeORM** with SQLite (default) or PostgreSQL.

## Key Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install deps (enforced: pnpm only; Node 22) |
| `pnpm dev` | Start full stack (Express boots Next.js internally); nodemon watches `server/` and `seerr-api.yml` |
| `pnpm build` | Full build: `build:next` then `build:server` (order matters) |
| `pnpm lint` | ESLint on `server/` and `src/` |
| `pnpm format` | Prettier format (includes organize-imports + tailwindcss plugins) |
| `pnpm format:check` | Prettier check (used by CI) |
| `pnpm typecheck` | Type-check both server and client |
| `pnpm test` | Run unit tests with `node:test` runner (NOT Jest) |
| `pnpm i18n:extract` | Extract i18n messages (must re-run if adding/changing UI strings) |
| `pnpm migration:generate <path>` | Generate TypeORM migration |
| `pnpm migration:run` | Run pending TypeORM migrations |
| `pnpm start` | Production start (requires `pnpm build` first) |
| `pnpm cypress:build` | Full prod build + seed test DB for Cypress E2E tests |
| `pnpm cypress:open` | Open Cypress test runner |

## Architecture

```
src/            Next.js client (pages router, Tailwind CSS, react-intl)
server/         Express server + TypeORM backend
  entity/       TypeORM entities
  migration/    DB migrations (sqlite/ and postgres/ subdirectories)
  routes/       Express route handlers
  lib/          Business logic (notifications, scanners, search, permissions)
  job/          Scheduled jobs
  test/         Test runner (node:test) and test setup
config/         Runtime config directory (mounted volume in Docker)
```

The server and client share a single `package.json`. Both run in the same Node process in production. The Express server in `server/index.ts` calls `next({ dev }).prepare()` then mounts Next's request handler as the final route.

## Path Aliases

- `@server/*` → `server/*` (used from both `src/` and `server/`)
- `@app/*` → `src/*` (used from `src/`)

**No relative imports** are allowed outside the same folder. Always use these aliases. ESLint enforces this.

## Database

- SQLite by default. Set `DB_TYPE=postgres` for PostgreSQL (plus `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, etc.)
- Config selected in `server/datasource.ts` based on `NODE_ENV` and `DB_TYPE`:
  - `test` → in-memory SQLite, `synchronize: true`, `dropSchema: true`
  - `development` → file-based SQLite (`config/db/db.sqlite3`), `synchronize: true`
  - `production` → `synchronize: false`, runs migrations on startup
- **Adding new features requiring migrations**: You must create **two** migrations — one in `server/migration/sqlite/` and one in `server/migration/postgres/`. See CONTRIBUTING.md for the full procedure.
- Runtime data lives in `config/` (settings.json, db/). This is a mounted volume in Docker.

## Testing

- Runner: **`node:test`** (native Node.js test runner), NOT Jest/Vitest
- Test files: `server/**/*.test.ts`
- Tests run against **SQLite in-memory** database. The test runner seeds test users before running.
- `pnpm test` runs all tests. Pass specific files: `pnpm test server/routes/auth.test.ts`
- Use `--test-name-pattern` to filter by test name

## Code Style

- **Prettier**: single quotes, trailing commas (es5), organize-imports + tailwind-class sorting
- **ESLint**: `@typescript-eslint/consistent-type-imports` enforces `import type` syntax
- **No `any`**: `@typescript-eslint/no-explicit-any` is `warn`
- **Unused vars**: error
- React self-closing components required
- FormatJS `no-offset` enforced for i18n
- Husky pre-commit runs lint-staged (format + lint). Commit messages must follow Conventional Commits.

## API

- OpenAPI spec: `seerr-api.yml`
- Request validation using `express-openapi-validator` (validates all `/api/v1` requests against the spec)
- Swagger UI served at `/api-docs` in dev
- API routes are mounted at `/api/v1`; everything else falls through to Next.js
- **Response validation gotcha**: The OpenAPI validator also validates responses. `server/index.ts` contains a `JSON.parse(JSON.stringify(json))` workaround to serialize Date objects to strings. When adding new API responses that include Date fields, ensure `seerr-api.yml` declares them as `type: string` with `format: date-time`.
- Authentication: Cookie (via `/auth/plex` or `/auth/local`) or API key (`X-Api-Key` header).

## PR Workflow

- Target `develop`, never `master`
- PR title must follow Conventional Commits (CI validates)
- PR template must be fully completed (CI bot checks and labels `blocked:template` if not)
- Run `pnpm build` and `pnpm test` before submitting
- AI assistance must be disclosed per CONTRIBUTING.md

## Environment

- Node 22, pnpm 10
- Default port: **5055**
- Docker dev: `docker compose up -d` (uses `Dockerfile.local`, mounts source for hot reload)
- Production: `Dockerfile` (multi-stage Alpine build, runs `npm start`)
- `gen-docs/` is a separate Docusaurus project (documentation site) with its own `package.json`; not part of the main build pipeline
