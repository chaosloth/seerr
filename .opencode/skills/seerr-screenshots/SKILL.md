---
name: seerr-screenshots
description: Use ONLY when taking screenshots of the Seerr UI for documentation. Launches Playwright Chromium, navigates to a page, waits for it to render, and captures a screenshot saved to gen-docs/static/img/. The Seerr dev server must be running on port 5055.
---

# Seerr Screenshots (Playwright)

## Prerequisites

Playwright with Chromium must be installed:

```bash
npx playwright install chromium
```

The Seerr dev server must be running on port 5055:

```bash
pnpm dev
```

## Screenshot script

Run the built-in script to capture a specific page:

```bash
export PATH="$HOME/.n/bin:$PATH"
pnpm tsx server/scripts/screenshot.ts --path "/settings/remotelibrary" --name "remote-library-settings"
```

Options:
| Flag | Required | Description |
|---|---|---|
| `--path` | Yes | URL path on the Seerr server (e.g., `/settings/remotelibrary`) |
| `--name` | Yes | Output filename (without extension). Saved to `gen-docs/static/img/<name>.png` |
| `--width` | No | Viewport width (default: 1440) |
| `--height` | No | Viewport height (default: 900) |
| `--dark` | No | Wait for dark mode render (default: true) |
| `--full-page` | No | Capture full page scroll (default: true) |
| `--selector` | No | Wait for this CSS selector before capturing |
| `--delay` | No | Extra wait in ms after page load (default: 2000) |

## Output

Screenshots are saved to `gen-docs/static/img/<name>.png`. Reference them in docs like:

```markdown
![Remote Library Settings](/img/remote-library-settings.png)
```

## Authenticated pages

The script logs in with the default test admin credentials:
- Email: `admin@seerr.dev`
- Password: `test1234`

The login session is cached across screenshots.

## Example: Documentation run

To capture all screenshots for a feature's docs:

```bash
pnpm tsx server/scripts/screenshot.ts --path "/settings/remotelibrary" --name "remote-library-settings"
pnpm tsx server/scripts/screenshot.ts --path "/settings/remotelibrary" --name "remote-library-modal" --selector ".modal" --delay 3000
pnpm tsx server/scripts/screenshot.ts --path "/discover/movies" --name "discover-friend-badge" --delay 3000
```
