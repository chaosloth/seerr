---
name: seerr-code
description: Use when writing ANY new code in this Seerr repo. Catalogs project-specific conventions, APIs, and patterns that differ from framework defaults and will cause type errors, lint failures, or runtime crashes if ignored. Read before creating components, routes, entities, or API handlers.
---

# Seerr Code Conventions

The conventions below are hard-earned; ignoring any of them causes typecheck, lint, or runtime failures.

## Toast notifications

Use `appearance`, NOT `type`:

```typescript
addToast('Message', { appearance: 'success' });  // ✅
addToast('Message', { type: 'success' });         // ❌ TS2353
```

Valid values: `'success'`, `'error'`, `'info'`, `'warning'`.

## Imports: always `import type` when possible

The ESLint rule `@typescript-eslint/consistent-type-imports` enforces `import type` for any import only used as a type. Enums used only in type positions (e.g., `as MediaType`) count as type-only.

```typescript
import type { MediaType } from '@server/constants/media';   // ✅ used only as a type
import { MediaType } from '@server/constants/media';        // ✅ used as a value (MediaType.MOVIE)
```

## No `any` (warned)

`@typescript-eslint/no-explicit-any` is `warn`. Avoid `any` unless unavoidable. Use `unknown` or proper types.

## No relative imports (except same folder)

```typescript
import { Router } from 'express';              // ✅ same folder: ./index.ts
import Media from '@server/entity/Media';     // ✅ path alias
import Media from '../../entity/Media';        // ❌ relative outside folder
```

Aliases: `@server/*` → `server/*`, `@app/*` → `src/*`.

## Modal component (`src/components/Common/Modal/`)

The `Modal` component does NOT have an `iconSvg` prop. Props available:

| Prop | Type | Notes |
|---|---|---|
| `title` | `string` | |
| `subTitle` | `string` | |
| `onCancel` | `(e?) => void` | |
| `onOk` | `(e?) => void` | |
| `cancelText` | `string` | |
| `okText` | `string` | |
| `okDisabled` | `boolean` | |
| `okButtonType` | `ButtonType` | |
| `cancelButtonType` | `ButtonType` | |

There is NO `iconSvg`, `icon`, or `iconComponent` prop. Adding one is a TS error.

## Sensitive fields

Use `<SensitiveInput>` (from `@app/components/Common/SensitiveInput`) for API keys, tokens, and passwords. It masks the value by default with a show/hide toggle.

```tsx
import SensitiveInput from '@app/components/Common/SensitiveInput';
<SensitiveInput id="apiKey" value={apiKey} onChange={...} />
```

## i18n strings

Use `defineMessages` for all UI text:

```typescript
import defineMessages from '@app/utils/defineMessages';
const messages = defineMessages('components.Settings.MyComponent', {
  myLabel: 'My Label',
});
// Usage: intl.formatMessage(messages.myLabel)
```

After adding/changing any UI string, run:
```bash
pnpm i18n:extract
```

## React components: self-closing

```tsx
<MyComponent />       // ✅
<MyComponent></MyComponent>  // ❌ lint error
```

## Editing files with repeated patterns

When editing files like `discover.ts` or `schedule.ts` that have 10+ nearly-identical route handlers or job definitions, text-match edits may match multiple instances unintentionally. After any edit to such files:

1. Run `pnpm typecheck` immediately (not at the end)
2. Verify the edit only changed the intended location
3. Search for duplicates: `grep -n "editedString" <file>` to count matches

## API response types

- Date fields in API responses MUST be declared as `type: string` with `format: date-time` in `seerr-api.yml`. The OpenAPI validator rejects Date objects.
- The response serialisation workaround in `server/index.ts` (`JSON.parse(JSON.stringify(json))`) handles this at runtime, but the spec must match.

## OpenAPI spec (`seerr-api.yml`)

- All `/api/v1/*` endpoints need a path definition
- Response and request schemas use `$ref: '#/components/schemas/Name'`
- Security block: `- cookieAuth: []` and `- apiKey: []` required
- Adding new endpoints? Read the `seerr-api` skill for full rules

## Entities and TypeORM

- `@DbAwareColumn` is a custom decorator for columns that differ between SQLite (`datetime`) and Postgres (`timestamp`/`timestampz`). Use it for date columns that vary by DB type.
- Every new entity needs TWO migrations: `server/migration/sqlite/` and `server/migration/postgres/`. See the `seerr-migration` skill.

## Settings vs Database entities

- **Settings** (`config/settings.json`): Radarr, Sonarr, Plex, Jellyfin config. Use `getSettings().radarr` etc.
- **Entities** (TypeORM/DB): Media, User, Request, etc. Use `getRepository(Entity)`.
- New config that needs foreign key relationships should be an entity. New config that needs to survive DB resets should be settings.

## Component imports from barrel files

Check existing components before importing. Many share barrels:
- `@app/components/Common/` — Badge, Button, Modal, SensitiveInput, LoadingSpinner, etc.
- `@app/components/Settings/` — Settings layout and sub-components

## Headless UI Transition + non-forwardRef children

When wrapping a component in `<Transition>`, Headless UI passes a ref to the child. If the child isn't a `React.forwardRef` component, React throws:

> Did you forget to passthrough the `ref` to the actual DOM node?

**Fix**: Either make the child `React.forwardRef`, or skip the `Transition` wrapper. `Modal` already has built-in transitions, so a simple `{isOpen && <MyModal />}` is sufficient.
