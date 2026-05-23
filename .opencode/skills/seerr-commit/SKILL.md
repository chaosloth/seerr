---
name: seerr-commit
description: Use ONLY when committing code changes to the Seerr git repository. Ensures Conventional Commits format, meaningful commit messages that describe what changed, and proper commit hygiene (staged files are intentional, no secrets, pre-commit hooks run).
---

# Seerr Commit Workflow

## Commit message format

Seerr enforces Conventional Commits via commitlint. Every commit message MUST follow:

```
type(scope): description
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`

**Scope**: The area of the codebase affected (e.g., `api`, `ui`, `scanner`, `db`, `settings`, `docker`, `i18n`). Use the directory or feature name.

**Description**: Lowercase, imperative mood ("add", not "added"). No period at the end.

### Examples

```
feat(scanner): add remote Seerr library scanner
fix(api): handle empty watchlist response
docs: add reverse proxy setup guide
chore(db): add RemoteLibrary and RemoteMedia migrations
```

## Pre-commit and commit-msg hooks

The repo has husky hooks that run automatically:

- **pre-commit**: Runs `lint-staged` (prettier + eslint on staged `.ts`/`.tsx`/`.js` files)
- **commit-msg**: Validates commit message against Conventional Commits

If the hooks fail, fix the issues and re-stage before committing again.

## Commit workflow

1. **Verify nothing is broken**: Run all checks BEFORE staging or committing.
   ```bash
   pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
   ```
   Fix every error before proceeding. The husky hooks catch formatting and lint on staged files, but type errors and test failures will slip through. **Do not skip this step.**

2. **Re-extract i18n if you touched UI strings**:
   ```bash
   pnpm i18n:extract
   ```

3. **Stage only intended files**: `git add <specific files>` — avoid `git add -A` or `git add .`

4. **Verify what's staged**: `git diff --cached --stat` to confirm only intended files

5. **No secrets**: Never commit `.env` files, API keys, or credentials

6. **No unrelated changes**: Only files relevant to the change

7. **Write the commit**: `git commit -m "type(scope): description"` — the hooks run automatically

8. **Verify the commit**: `git log --oneline -1` to check the commit succeeded

## Multi-phase feature commits

When working on a feature with multiple phases, commit after each completed phase. Write commits that describe what was built, not a step-by-step log. Group related changes into logical units.

### Phase-appropriate commit messages

```
feat(remote-library): add RemoteLibrary and RemoteMedia entities with migrations
feat(remote-library): add CRUD API routes and settings UI for remote libraries
feat(seerr-scanner): add Scanner for remote Seerr instance availability
feat(discover): show friend library availability on discover and search results
feat(ui): add FriendBadge component for remote availability
```

## Checking git status before committing

Always run these before committing:

```bash
git status
git diff --cached --stat
```

If `git status` shows unexpected files, unstage them with `git restore --staged <file>`.

## What NOT to commit

- `.env` files
- API keys, tokens, or passwords
- `node_modules/`
- `dist/` or `.next/` build output
- `config/db/*.sqlite3`
- `config/settings.json` (local dev settings)
- Editor temp files (`*.swp`, `*~`, `.DS_Store`)
- `.opencode/` internal files (unless intentionally adding skills/plans)
