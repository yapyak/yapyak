---
title: How it works
order: 3
---

yapyak is a Vite plugin and a tiny runtime. The plugin watches your source files. Each save runs a pipeline that ends with locale variants inlined at the call site. The full mechanic below.

## The compile transform

What you write:

```tsx
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

What yapyak compiles it to:

```tsx
import { pick as _pick } from 'yapyak/internal';

export function SaveButton() {
  return <button>{_pick({ en: 'Save changes', sv: 'Spara ändringar', es: 'Guardar cambios' })}</button>;
}
```

The variants for each locale are inlined as a const object. `_pick()` reads the current locale and returns the matching value synchronously.

Without any locales configured, yapyak disappears:

```tsx
export function SaveButton() {
  return <button>Save changes</button>;
}
```

The `_pick()` call gets stripped out, leaving the source string as a plain literal. Adopt yapyak today, add locales next month, the rest of your code stays the same.

## Per-framework AST processors

The compile transform runs through a processor selected by file extension. Each processor wraps a framework's official compiler so extraction and rewrite happen through the same AST the framework itself uses.

| File extension | Processor | AST library |
|---|---|---|
| `.ts`, `.tsx`, `.jsx`, `.mjs` | vanilla | TypeScript compiler |
| `.vue` | vue | `@vue/compiler-sfc` + `@vue/compiler-core` |
| `.svelte` | svelte | `svelte/compiler` (modern mode) |
| `.astro` | astro | `@astrojs/compiler/sync` |

Each processor knows where to inject the `pick` import, which fragments contain executable code (script blocks vs template fragments), and how template-level expressions map back to source positions. The TypeScript portions inside Vue `<script setup>`, Svelte `<script>`, or Astro frontmatter are parsed identically to plain `.ts` files because the processor hands those fragments through.

This means `t('Save changes')` inside `<template>{{ t('Save changes') }}</template>` and `<button>{t('Save changes')}</button>` both get extracted, rewritten, and inlined using the framework's own understanding of the source.

Vue, Svelte, and Astro share the full downstream pipeline with TSX. Once executable fragments are isolated, every downstream step works identically across frameworks.

Adding a new framework is writing a processor: parse the file with the framework's AST, identify executable fragments, hand them through the TypeScript pipeline. The current four processors total around 1900 lines of TypeScript.

## The save pipeline

The Vite plugin runs this on every `.tsx`/`.ts`/`.vue`/`.svelte` save:

1. **Extract.** Parse the file with the TypeScript compiler. Collect each `t()` call along with its call-site context (line, column, source string, surrounding code). Static analysis catches eight classes of mistake at this step, each with its own diagnostic code (`YPK001` dynamic source, `YPK002` missing param, `YPK003` extra param, `YPK005` spread params, `YPK007` invalid plural, `YPK008` empty source, and others).
2. **Detect renames.** If a string disappeared from line 23, column 12 and a new one appeared at the same position, that's a rename, not a delete plus add.
3. **Sync locale files.** New strings get empty entries in every `locales/*.json`. Removed strings get pruned.
4. **Translate.** If a translator is configured and the new-string count is under the threshold, missing entries go to the AI in batches, each carrying its call-site context.
5. **Inline and HMR.** Vite re-bundles, the transform reads fresh locale data and inlines the variants, the browser updates.

If no translator is configured, step 4 is skipped. Stubs stay empty until you fill them by hand. If too many strings would translate at once (default: more than 20), step 4 also skips and logs a hint to run the CLI.

## The auto-translate threshold

To keep saves snappy, yapyak applies a per-save translation cap:

| Scenario | Behavior |
|---|---|
| Save adds 1-20 new strings | Translated immediately, invisible (~1s) |
| Save adds 50 new strings (paste-bomb) | Bail. `[yapyak] 50 new strings detected. Run \`pnpm yapyak translate\` to fill.` |
| Empty `ru.json` created, no edits | Stubs sync, no translation. `pnpm yapyak translate ru` fills 1000 strings in under a minute with a live progress bar |

Set `autoTranslateThreshold: 0` in your plugin config to disable on-save translation entirely. The configured translator is still used by the CLI, which is useful for manual control over when API calls happen.

## Rename detection

yapyak tracks `t()` calls by **position** in the source: line and column, not string similarity. When you edit `t('Save')` to `t('Save changes')` on the same line and column, the diff looks like a rename, and existing translations move with the call site.

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
|---|---|
| `true` (default when no translator is configured) | Old translation carried to the new key. Your handwritten Swedish "Spara" survives. |
| `false` (default when a translator is configured) | New key gets an empty stub. The AI re-translates from the new source. |

The split exists because intent differs. Manual workflows want handwritten translations preserved across small edits. AI workflows usually want a re-translation because the new source string may mean something subtly different.

If a string is moved *and* renamed in the same save, position-matching fails. yapyak treats it as a delete plus add, and the translation is lost. Rename detection is line+column-strict by design. Fuzzy matching would happily rebind "Submit" to "Sign me up" and call it a feature.

## Call-site context

For every missing entry, yapyak extracts a context object from the call site and attaches it to the translation request:

```json
{
  "source": "Save changes",
  "component": "SaveButton",
  "element": "button",
  "snippet": "  return (\n    <button>{t('Save changes')}</button>\n  );"
}
```

- **component**: derived from the file path (`save-button.tsx` becomes `SaveButton`).
- **element**: the nearest opening JSX tag above the call (`button`, `h1`, `label`).
- **snippet**: three lines above and below the call site, dedented.

The translator uses this to disambiguate intent. "Save" in a `<button>` reads differently from "Save" in an `<h1>`. How much of the context the translator passes to the model is configurable. See [Translators / Translation context](/guide/translators#translation-context).

## Batching, concurrency, order

yapyak batches AI calls. Default: 25 strings per request, 5 requests in parallel via a worker pool. Concretely: 1000 strings divide into 40 batches, executed across 5 parallel workers.

The worker pool preserves order. Translations come back in the exact order requested, regardless of which batch resolved first. Per-chunk progress streams live to the CLI:

```shell
fi · 478/1000 · ███████████░░░░░░░░░░░░░
```

All four knobs (`batchSize`, `concurrency`, `autoTranslateThreshold`, per-provider `max_tokens`) are configurable. The defaults are tuned to land big batches in seconds without blowing rate limits.

## Why the call-site inline matters

Translations travel with the code that uses them. Vite splits your app into chunks per route. yapyak's translations split with it: same chunks, same boundaries.

A runtime catalog is the wrong shape for a code-splitting world. Ship everything to every chunk and you waste bandwidth. Async-load the catalog on first render and you get a waterfall. yapyak does neither.
