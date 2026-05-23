---
name: seerr-docker
description: Use ONLY when building, testing, or verifying Seerr Docker images and containers. Covers the multi-stage production Dockerfile, dev compose stack, PostgreSQL compose variant, local image smoke-testing, and running unit/E2E tests inside containers. Do not use for generic Docker advice.
---

# Seerr Docker Build & Test

## Dockerfiles

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage production build (Alpine). Compiles server + Next.js, outputs minimal image. |
| `Dockerfile.local` | Development image. Mounts source for hot-reload via `pnpm dev`. Used by `compose.yaml`. |

## Compose stacks

### Development (hot-reload, SQLite)

```bash
docker compose up -d
```

Mounts the project root as a volume. Source changes trigger nodemon restarts. The `.next/` and `node_modules/` directories are excluded from the bind mount via anonymous volumes so the host and container don't conflict.

Access the app at `http://localhost:5055`.

### Development with PostgreSQL

```bash
docker compose -f compose.postgres.yaml up -d
```

Adds a `postgres:18` container linked to the Seerr service. Sets `DB_TYPE=postgres` and all required env vars. Useful for testing Postgres-specific code or generating Postgres migrations.

## Building the production image locally

### Standard build (single arch)

```bash
docker build -t seerr:test -f Dockerfile .
```

Required build args (optional but recommended for version stamp):

| Arg | Purpose |
|---|---|
| `COMMIT_TAG` | Git SHA displayed in the UI and used for update checks |
| `BUILD_VERSION` | Version string (defaults to `develop` if unset) |

```bash
docker build \
  --build-arg COMMIT_TAG=$(git rev-parse HEAD) \
  --build-arg BUILD_VERSION=develop \
  -t seerr:test \
  -f Dockerfile .
```

### Multi-arch build (if testing ARM/ARM64)

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg COMMIT_TAG=$(git rev-parse HEAD) \
  -t seerr:test \
  -f Dockerfile .
```

## Smoke-testing the production image

After building the image, run it and verify it starts correctly:

```bash
docker run --rm -p 5055:5055 seerr:test
```

Wait for the log line `Server ready on port 5055`, then:

```bash
curl -s http://localhost:5055/api/v1/status | head -c 200
```

Expected: JSON with `api: "Seerr API"` and `version: "1.0"`.

To test with a persistent config directory:

```bash
mkdir -p /tmp/seerr-test-config
docker run --rm \
  -p 5055:5055 \
  -v /tmp/seerr-test-config:/app/config \
  seerr:test
```

To test with PostgreSQL locally:

```bash
docker run --rm \
  -p 5055:5055 \
  -e DB_TYPE=postgres \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USER=seerr \
  -e DB_PASS=seerr \
  -e DB_NAME=seerr \
  seerr:test
```

## Running unit tests in a container

Unit tests use the `node:test` runner (NOT Jest) and need the full source tree with dev dependencies:

```bash
docker compose run --rm seerr pnpm test
```

To run a specific test file:

```bash
docker compose run --rm seerr pnpm test server/routes/auth.test.ts
```

To run tests with a test name filter:

```bash
docker compose run --rm seerr pnpm test -- --test-name-pattern "auth"
```

(Note: `--` separates pnpm args from the test runner args.)

## Running Cypress E2E tests

Cypress tests run against a production build with a seeded test database.

### Option 1: Host (recommended for debugging)

```bash
pnpm cypress:build    # Full prod build + seed test DB
pnpm start &          # Start Seerr on port 5055
pnpm cypress:open     # Open Cypress test runner
```

Stop the background Seerr process when done: `kill %1`

### Option 2: Docker (CI-like)

Build the production image with Cypress settings pre-seeded:

```bash
docker build \
  --build-arg COMMIT_TAG=$(git rev-parse HEAD) \
  -t seerr:cypress-test \
  -f Dockerfile .
```

Then seed the test settings and DB, start the container, and run Cypress from the host (or a Cypress container).

## Build caching and performance

The production `Dockerfile` uses Docker BuildKit cache mounts for pnpm. To warm the cache:

```bash
docker buildx build \
  --build-arg COMMIT_TAG=$(git rev-parse HEAD) \
  -t seerr:test \
  -f Dockerfile \
  --cache-to type=local,dest=/tmp/docker-cache \
  --cache-from type=local,src=/tmp/docker-cache \
  .
```

## Verifying the image

After building, check the image is sane:

```bash
# Image size (should be ~300-400 MB)
docker images seerr:test

# Entrypoint and exposed ports
docker inspect seerr:test --format '{{.Config.Cmd}} | Ports: {{.Config.ExposedPorts}}'

# Verify node_modules are production-only (no dev deps)
docker run --rm --entrypoint sh seerr:test -c "ls node_modules/.pnpm | grep cypress || echo 'No Cypress (good)'"

# Verify dist/ exists (compiled server)
docker run --rm --entrypoint sh seerr:test -c "ls dist/index.js && echo 'dist/ OK'"

# Verify .next/ exists (compiled Next.js)
docker run --rm --entrypoint sh seerr:test -c "ls .next/BUILD_ID && echo '.next/ OK'"
```
