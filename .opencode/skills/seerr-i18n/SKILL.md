---
name: seerr-i18n
description: Use when adding or changing internationalized (i18n) strings. Covers the defineMessages pattern, pnpm i18n:extract, the 40 locale files, translating across all locales, checking for missing keys, formatting, and commit conventions.
---

# Seerr Internationalization (i18n)

## How i18n works

Seerr uses **react-intl** (FormatJS) with `defineMessages` for component-level message definitions. Messages are extracted to `src/i18n/locale/en.json` and translated into 39 additional locale files.

## Locale files

```
src/i18n/locale/
  en.json         ← source of truth (40 total locale files)
  ar.json, bg.json, ca.json, cs.json, da.json, de.json,
  el.json, es.json, es_MX.json, et.json, eu.json, fi.json,
  fr.json, he.json, hi.json, hr.json, hu.json, it.json,
  ja.json, kab.json, ko.json, lb.json, lt.json, nb_NO.json,
  nl.json, pl.json, pt_BR.json, pt_PT.json, ro.json, ru.json,
  sk.json, sl.json, sq.json, sr.json, sv.json, tr.json,
  uk.json, vi.json, zh_Hans.json, zh_Hant.json
```

All locale files are JSON objects where keys are generated from the `defineMessages` prefix + message key, and values are the translated strings.

Keys use a dot-separated namespace: `components.Settings.menuRemoteLibraries`

## Adding a new message

In a component, use `defineMessages`:

```typescript
import defineMessages from '@app/utils/defineMessages';

const messages = defineMessages('components.Foo', {
  title: 'Page Title',
  description: 'A longer description',
  buttonLabel: '{count} items',
});
```

Then reference with `useIntl()`:

```typescript
const intl = useIntl();
intl.formatMessage(messages.title)
intl.formatMessage(messages.buttonLabel, { count: 5 })
```

The first argument to `defineMessages` is a namespace prefix. The keys (`title`, `description`, etc.) become the full message IDs: `components.Foo.title`, `components.Foo.description`, etc.

## Extracting messages

After adding/changing any `defineMessages` calls, run extraction:

```bash
pnpm i18n:extract
```

This updates `src/i18n/locale/en.json` with the new/changed keys. It does NOT touch other locale files.

## Adding translations to all locales

After extracting, the new keys exist only in `en.json`. You must add translations to all 39 other locale files. Each locale JSON file must contain all the same keys as `en.json`.

### Checking for missing keys

To find which keys are missing from a locale:

```python
import json

with open('src/i18n/locale/en.json') as f:
    en = json.load(f)

with open('src/i18n/locale/fi.json') as f:
    locale = json.load(f)

missing = set(en.keys()) - set(locale.keys())
for k in sorted(missing):
    print(f'{k}: {en[k]}')
```

Or check all locales at once — iterate over all files in `src/i18n/locale/` excluding `en.json`.

### Adding translations

When inserting translations into locale files, follow these rules:

1. **Open the file as JSON**, add the key, write back as JSON with `ensure_ascii=False, indent=2`
2. **Run `pnpm format`** after editing locale files (Prettier needs to sort keys and format)
3. **Verify** by re-reading the file and checking the key exists

For the actual translations:
- Use a Python dict mapping lang codes to translated strings
- Keep translations consistent with existing strings in that locale file (same tone, formality level)
- For partial translations (languages marked as partially supported), shorter/informal translations are acceptable

### Common gotcha

The `defineMessages` namespace prefix is concatenated with a dot. If you have:

```typescript
const messages = defineMessages('components.Settings', {
  menuRemoteLibraries: 'Remote Libraries',
});
```

The key in `en.json` will be `components.Settings.menuRemoteLibraries` — NOT `components.Settings.RemoteLibrary.menuRemoteLibraries`. The prefix is literal string concatenation, not inferred from the file path.

Similarly, the header for the page might be:

```typescript
const messages = defineMessages('components.Settings.RemoteLibrary', {
  remotesettings: 'Remote Libraries',
});
```

Which produces `components.Settings.RemoteLibrary.remotesettings`. These are **different keys** from `components.Settings.menuRemoteLibraries` and must be translated separately.

## Formatting

Locale JSON files must match Prettier formatting. Always run after editing:

```bash
pnpm format
```

Prettier will sort keys alphabetically and apply trailing comma rules.

## Commit conventions

For i18n changes:

```
chore(i18n): translate remote library strings to all remaining locales
fix(i18n): add missing menuRemoteLibraries translations to 39 locales
```

Use `chore(i18n):` for new translations and `fix(i18n):` for bug fixes (missing keys, wrong translations).

## Verification checklist

Before committing i18n changes:

- [ ] `en.json` has all new keys (run `pnpm i18n:extract` if needed)
- [ ] All 39 non-English locales have the new keys translated
- [ ] No locale has extra/obsolete keys that aren't in `en.json`
- [ ] `pnpm format:check` passes on locale files
- [ ] `pnpm typecheck` passes
