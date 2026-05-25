---
title: How it works
order: 3
---

You write `$t()` in your code. yapyak rewrites the call to inline the translations for every locale, right at the call site.

## What you write

```tsx
import { $t } from 'yapyak';

export function SaveButton() {
  return <button>{$t('Save changes')}</button>;
}
```

## What yapyak compiles it to

```tsx
import { pick as _pick } from 'yapyak/internal';

export function SaveButton() {
  return <button>{_pick({ en: 'Save changes', sv: 'Spara ändringar', es: 'Guardar cambios' })}</button>;
}
```

The variants are inlined at the call site. At runtime, `_pick()` returns the right one for the current locale.

Without any locales configured, yapyak disappears entirely and returns the string as-is:

```tsx
export function SaveButton() {
  return <button>Save changes</button>;
}
```

Which means you can adopt yapyak — and get everything in place — for free, even before you have any translations. The day you add a locale, nothing in your code needs to change.

## On save

On save, yapyak's Vite plugin:

1. **Re-extract.** It parses the file and collects every `$t()` call: source string, line, column, and the surrounding context.
2. **Detect renames.** If a string disappeared from line 23, column 12 and a new one appeared at the same position, that's a rename — not a delete plus add.
3. **Sync locale files.** New strings get empty entries in every `locales/*.json`. Removed strings get pruned.
4. **Translate.** If a translator is configured, missing entries are batched and sent to the AI with the call-site context attached.
5. **Inline + HMR.** Vite re-bundles the file, the transform reads the fresh locale data and inlines the variants, the browser updates.

If no translator is configured, step 4 is skipped — the stubs stay empty until you fill them by hand.

## Rename detection

yapyak tracks `$t()` calls by *position* in the source — line and column — not by string similarity. When you edit `$t('Save')` to `$t('Save changes')` on the same line and column, the diff looks like a rename, and existing translations move with the call site.

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
  "component": "SaveButton",
  "element": "button",
  "snippet": "  return (\n    <button>{$t('Save changes')}</button>\n  );"
}
```

- **component** — derived from the file path (`save-button.tsx` → `SaveButton`).
- **element** — the nearest opening JSX tag above the call (`button`, `h1`, `label`, etc.).
- **snippet** — three lines above and below the call site, dedented.

The translator uses this to disambiguate: "Save" in a `<button>` reads differently from "Save" in an `<h1>`. How much of the context the translator passes to the model is configurable — see [Translators / Translation context](/guide/translators#translation-context).

## Why the call-site inline matters

Translations travel with the code that uses them. Vite splits your app into chunks per route; yapyak's translations follow that split automatically. Bundle size scales with the strings actually used per chunk, not the total strings in the project.
