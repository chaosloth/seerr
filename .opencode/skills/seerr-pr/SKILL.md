---
name: seerr-pr
description: Use ONLY when creating or preparing a pull request for Seerr (seerr-team/seerr). Covers the exact PR template format, Conventional Commits title requirements, AI disclosure rules, branch naming, CI-validated checklist, and pre-submit verification steps. Do not use for general GitHub PR advice.
---

# Seerr Pull Requests

## Target branch

Always target `develop`. Never open a PR against `master`. CI blocks `master` PRs.

## Branch naming

Create branches from `develop`. Use meaningful, kebab-case names:

```
git switch -c <prefix>-<description> develop
```

Good: `fix-title-cards`, `feature-new-system`, `docs-docker`
Bad: `bug`, `fix`, `patch` (too generic — CI may flag these)

Keep your branch rebased on `develop` before submitting:

```bash
git fetch upstream
git rebase upstream/develop
```

## Pre-submit verification

Run these before opening the PR. If any fail, fix before submitting.

```bash
pnpm lint            # ESLint on server/ and src/
pnpm format:check    # Prettier check
pnpm typecheck       # Type-check server + client
pnpm test            # Unit tests (node:test)
pnpm build           # Full build (build:next then build:server)
pnpm i18n:extract    # Re-extract i18n messages if UI strings touched
```

## PR title: Conventional Commits

PR titles MUST follow [Conventional Commits](https://www.conventionalcommits.org/). The PR validation workflow (`pr-validation.yml`) runs `action-semantic-pull-request` and fails the check if the title does not conform.

Format: `type(scope): description`

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`

Examples:
- `feat(notifications): add Ntfy notification agent`
- `fix(api): handle empty watchlist response`
- `docs: add reverse proxy setup guide`
- `refactor(scanner): extract Plex library sync logic`

## PR body: EXACT template

The PR description MUST follow the GitHub PR template exactly. The template check workflow (`pr-validation.yml`) parses the description and labels the PR `blocked:template` if sections are missing or placeholders are unfilled.

Do NOT substitute a different format (e.g., "Summary / What changed / Root cause / Test plan"). That is flagged as unreviewed AI output.

### Required sections

```markdown
### Description

[Describe your changes in detail. Why is this change required? What problem
does it solve? If it fixes an open issue, link it with "Fixes #XXXX".]

- Fixes #XXXX

### How Has This Been Tested?

[Describe in detail how you tested your changes. Include your testing
environment, which tests you ran, and how your change affects other areas.]

### Screenshots / Logs (if applicable)

[Attach screenshots or log output. Remove this section if not applicable.]

### Checklist:

- [ ] I have read and followed the contribution guidelines.
- [ ] **AI Disclosure:** [Describe AI usage or state "None." — see rules below]
- [ ] I have updated the documentation accordingly.
- [ ] All new and existing tests passed.
- [ ] Successful build `pnpm build`
- [ ] Translation keys `pnpm i18n:extract`
- [ ] Database migration (if required)
```

### AI disclosure line

The second checklist item MUST include an explicit disclosure. The project requires this. Replace the bracketed text with one of:

- `**AI Disclosure:** None.`
- `**AI Disclosure:** I consulted [tool name] to [purpose] but the solution was fully authored manually by myself.`
- `**AI Disclosure:** This PR was written primarily by [tool name].`

If you are using any AI assistance at all (including this session), it must be disclosed. Only trivial tab-completion is exempt.

PR descriptions and comments MUST be in your own words. Do not paste LLM output as the PR description.

## Checklist items — when to check each

| Item | When to check |
|---|---|
| Read and followed contribution guidelines | Always |
| AI disclosure | Always |
| Updated documentation | If you changed behavior, config, or user-facing text |
| All new and existing tests passed | Always (run `pnpm test`) |
| Successful build `pnpm build` | Always |
| Translation keys `pnpm i18n:extract` | If you added or modified any UI string |
| Database migration (if required) | If you added/removed/changed entities |

Only check boxes that are actually true. Unchecked boxes where work was done, or checked boxes where it wasn't, are both red flags for maintainers.

## Using `gh` CLI

To create the PR from the command line:

```bash
gh pr create \
  --base develop \
  --title "fix(api): handle empty watchlist response" \
  --body-file /path/to/pr-body.md
```

Write the body to a file first (do NOT inline long bodies in the command). Verify the body with:

```bash
node bin/check-pr-template.mjs /path/to/pr-body.md
```

If the template check fails, fix the body before creating the PR.

## What CI validates

1. **PR title** — must match Conventional Commits (check: `semantic-title`)
2. **PR template** — sections must be filled, placeholders removed (check: `template-check`)
3. **i18n** — translation messages must be in sync (`pnpm i18n:extract` must have been run)
4. **Lint + Format** — ESLint and Prettier checks
5. **Build** — `pnpm build` must succeed
6. **Unit tests** — `pnpm test` must pass

A PR with failing CI checks will not be reviewed. Fix failures before asking for review.

## Common mistakes that cause rejection

- PR title is not Conventional Commits ("Add feature", "Bug fix")
- PR body uses a non-template format ("Summary / What changed / Root cause / Test plan")
- Missing or unchecked AI disclosure
- "Fixes #XXXX" placeholder left unfilled with no issue linked
- "How Has This Been Tested?" left blank or says "tested locally"
- Checklist items checked off that were clearly not done (e.g., docs not actually updated)
- Target is `master` instead of `develop`
- PR includes unrelated changes (broad AI prompts)
- `pnpm build` was not run (fails in CI)
