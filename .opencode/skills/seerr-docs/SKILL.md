---
name: seerr-docs
description: Use ONLY when writing, editing, or reviewing Seerr's documentation site content in docs/ or gen-docs/. Covers Docusaurus conventions, the project's UI text style guide (proper-noun capitalization, Oxford comma, Unicode), admonition syntax, frontmatter, and how to build/preview docs locally.
---

# Seerr Documentation

## Where documentation lives

| Directory | Purpose |
|---|---|
| `docs/` | Documentation content (markdown/MDX). The Docusaurus site source. |
| `gen-docs/` | Docusaurus wrapper. Builds `docs/` into a static site. Separate `package.json`; not part of the main `pnpm build`. |

The Docusaurus config (`gen-docs/docusaurus.config.ts`) points at `../docs` as the content directory. Edits in `docs/` are reflected when the Docusaurus site is rebuilt.

## Building and previewing

```bash
cd gen-docs
pnpm install
pnpm start          # dev server at http://localhost:3000, live reload
pnpm build          # production build to gen-docs/build/
```

The API docs are auto-generated from `seerr-api.yml`:
```bash
cd gen-docs
pnpm gen-api-docs all
pnpm clean-api-docs all
```

## Document conventions

### Frontmatter (required)

Every doc page needs YAML frontmatter:

```yaml
---
title: Page Title
description: One-sentence description for search/social.
sidebar_position: 3   # integer; controls sort order in the sidebar
---
```

The page title from frontmatter renders as the `h1`, so do not repeat it with a leading `#` unless the title needs formatting the frontmatter can't express.

### Admonitions (Docusaurus syntax)

```
:::note
Optional note box.
:::

:::info
Information box (blue).
:::

:::tip
Tip box (green).
:::

:::warning
Warning box (yellow).
:::

:::danger
Danger box (red).
:::
```

### Links and images

- Inter-doc links: `./relative/path` (Docusaurus resolves `.md` / `.mdx`).
- External links: full URLs.
- Do not use raw `<img>` tags; use Markdown `![alt](url)` unless Docusaurus Image component is required.
- Edit URLs are configured in `docusaurus.config.ts` under `presets.classic.docs.editUrl`.

### Category files

To override a sidebar category label or position, add a `_category_.json` in the directory:

```json
{
  "label": "Custom Label",
  "position": 2
}
```

## UI Text Style Guide

When writing documentation, follow the project's UI text conventions from CONTRIBUTING.md:

1. **Be concise.** Use as few words as possible to make your point.
2. **Oxford comma.** Use it where appropriate (e.g., "Sonarr, Radarr, and Lidarr").
3. **Unicode characters.** Use proper Unicode for ellipses (…), arrows (→), and other symbols. Avoid ASCII fallbacks.
4. **Capitalize proper nouns correctly:**
   - Plex, Jellyfin, Emby
   - Radarr, Sonarr, Lidarr
   - TMDB, IMDb (lowercase 'b'), TheTVDB
   - Discord, Telegram, Slack, Pushover, Pushbullet, Gotify, Ntfy
   - Webhook, Web Push
5. **Title Case** for headings, button labels, and form labels.
6. **Sentence case** for validation errors, dropdown items, and form tips (no ending punctuation).
7. **Spell "Seerr" correctly** (double-e, double-r).

## Content guidelines

- Write in instructional second person ("you can configure..."), not passive voice.
- Start each page with a one-sentence summary of what the feature/option does.
- Put the most common use case first; advanced/optional details later.
- For settings pages, list each setting as its own `##` section with a clear description of what it does, its default value, and any side effects.
- If a feature requires a specific permission, mention it. Use the exact permission name as it appears in the settings UI.
- Screenshots: keep them current. If the UI changes, update the screenshot.

## When adding a new doc page

1. Create the `.md` file in the appropriate `docs/` subdirectory.
2. Add frontmatter with `title`, `description`, and `sidebar_position`.
3. Docusaurus auto-generates the sidebar from the filesystem, so no sidebar config changes are needed unless you want a custom order/category.
4. Optionally add a `_category_.json` in the parent directory for label/position overrides.
5. Test locally with `cd gen-docs && pnpm start`.
6. Update the PR checklist: check "I have updated the documentation accordingly."
