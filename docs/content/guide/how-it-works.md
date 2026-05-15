---
title: How it works
order: 3
---

You write `t()` in your code. yapyak rewrites the call to a compact lookup, then emits each non-default locale as its own lazy-loaded chunk.

## What you write

```tsx
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

## What yapyak compiles it to

```tsx
import { pick as _$pick } from 'yapyak/internal';

export function SaveButton() {
  return <button>{_$pick('src/components/save-button.tsx', 'Save changes')}</button>;
}
```

The call site keeps only the file path and the source string. The runtime `_$pick()` returns the source directly when the current locale is the default (so the default locale costs zero extra bytes), or looks up `(fileId, source)` in the active locale's data when it's not.

## Per-locale chunks

For every non-default locale, the Vite plugin emits a virtual module:

```ts
// virtual:yapyak/locales/sv
export default {
  'src/components/save-button.tsx': {
    'Save changes': 'Spara ändringar',
  },
  // ...one entry per (fileId, source) pair
};
```

These modules are dynamically imported by the runtime when `setLocale()` or `loadLocale()` is called. Rolldown (Vite's bundler) splits each into its own chunk; only the user's current locale lives in memory at any time.

## On save

When the file saves, yapyak's Vite plugin runs five steps:

1. **Re-extract.** It parses the file and collects every `t()` call: source string, line, column, and the surrounding context.
2. **Detect renames.** If a string disappeared from line 23, column 12 and a new one appeared at the same position, that's a rename — not a delete plus add.
3. **Sync locale files.** New strings get empty entries in every `locales/*.json`. Removed strings get pruned.
4. **Translate.** If a translator is configured, missing entries are batched and sent to the AI with the call-site context attached.
5. **Re-emit + HMR.** Vite re-bundles the file, regenerates the affected locale virtual modules, and the browser hot-swaps the active locale's data.

If no translator is configured, step 4 is skipped — the stubs stay empty until you fill them by hand.

## Rename detection

yapyak tracks `t()` calls by *position* in the source — line and column — not by string similarity. When you edit `t('Save')` to `t('Save changes')` on the same line and column, the diff looks like a rename, and existing translations move with the call site.

```diff
// locales/sv.json
{
  "src/components/save-button.tsx": {
-    "Save": "Spara",
+    "Save changes": "Spara"
  }
}
```

The non-default locales get one of two treatments, depending on `preserveTranslationsOnRename`:

| Setting | Behavior |
|---------|----------|
| `true` (default when no translator is configured) | Old translation carried to the new key. Your handwritten Swedish "Spara" survives. |
| `false` (default when a translator is configured) | New key gets an empty stub. The AI re-translates from the new source. |

The split exists because intent differs. Manual workflows want their handwritten translations preserved across small edits. AI workflows usually want a re-translation because the new source string may mean something subtly different. Override the default by setting `preserveTranslationsOnRename` in your plugin config.

If a string is moved *and* renamed in the same save, position-matching fails — yapyak treats it as a delete plus add, and the translation is lost. Rename detection is line+column-strict by design; fuzzy matching would silently rebind unrelated strings.

## What gets sent to the AI

For every missing entry, yapyak extracts a context object from the call site:

```json
{
  "source": "Save changes",
  "componentName": "SaveButton",
  "enclosingElement": "button",
  "snippet": "  return (\n    <button>{t('Save changes')}</button>\n  );"
}
```

- **componentName** — derived from the file path (`save-button.tsx` → `SaveButton`).
- **enclosingElement** — the nearest opening JSX tag above the call (`button`, `h1`, `label`, etc.).
- **snippet** — three lines above and below the call site, dedented.

The translator uses this to disambiguate: "Save" in a `<button>` reads differently from "Save" in an `<h1>`. How much of the context the translator passes to the model is configurable — see [Translators / Translation context](/guide/translators#translation-context).

## Why this architecture scales

Two properties of the design make it fast at every scale:

**Source-as-keys.** The default locale's text lives in your source code, so it costs nothing extra in the bundle. Other locales reference the same `(fileId, source)` pair, so the runtime knows exactly which translation to swap in.

**Per-locale chunks.** Initial loads ship only the default locale (free) plus the active locale (if different). A user browsing in `sv` never pays for the `de`, `fr`, `es` chunks. Compare this to libraries that inline every variant at every call site — those bundles grow linearly with `locales × strings`.

A medium app with 5 locales and 10,000 strings ships roughly 4–5× less initial JavaScript than the inline-variants approach.
