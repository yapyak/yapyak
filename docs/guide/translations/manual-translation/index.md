# Manual translation

For all the AI yap yap, yapyak works just as well without it.

Skip the `translator` option and you get a clean source-as-keys i18n library: locale files scaffolded for you, position-aware rename detection, type-safe `t()`, per-file scoping, ICU MessageFormat, HMR — all the structural wins, none of the API calls.

This is the right setup when you have human translators, work with a TMS (Crowdin, Lokalise, Phrase), need to comply with policies that forbid sending source code to third-party LLMs, want your code agent (Claude Code, Cursor, Copilot) to fill the stubs from your editor, or just prefer to write translations yourself.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      persistence: 'cookie',
    }),
  ],
});
```

No `translator`. That's it.

## The flow

You write `t()` calls as usual:

::: code-group

```tsx [React]
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

```svelte [Svelte]
<script lang="ts">
  import { t } from 'yapyak';
</script>

<button>{t('Save changes')}</button>
```

```vue [Vue]
<script setup lang="ts">
import { t } from 'yapyak';
</script>

<template>
  <button>{{ t('Save changes') }}</button>
</template>
```

:::

On save, yapyak detects the new string and adds it to every locale file as an **empty stub**:

```json
{
  "src/components/save-button.tsx": {
    "Save changes": ""
  }
}
```

Open the file, fill it in:

```json
{
  "src/components/save-button.tsx": {
    "Save changes": "Guardar cambios"
  }
}
```

Save. HMR pushes the new copy live. Same dev-loop feel, just with your hands on the keyboard instead of an API key.

## Adding a locale

```bash
npx yapyak add es
```

Without a translator, this creates `locales/es.json` with every `t()` call scaffolded as an empty stub. No network calls. Instant.

```json
{
  "src/components/save-button.tsx": {
    "Save changes": ""
  },
  "src/components/cancel-button.tsx": {
    "Cancel": ""
  }
}
```

Fill in stubs at your own pace. Untranslated keys fall back to the source string at runtime, so a half-finished locale still renders.

If you're handing the work off to a translator instead of typing the values yourself, snapshot the file with `yapyak export es` and send it along. See [handing off to a translator](#handing-off-to-a-translator) for the round-trip.

## Renames keep your translations

Without a translator, this is the feature that makes source-as-keys viable at all. Rename `t('Save')` to `t('Save changes')` and your existing translations stay attached.

```diff
- t('Save')
+ t('Save changes')
```

Before, in `locales/es.json`:

```json
{ "src/save-button.tsx": { "Save": "Guardar" } }
```

After saving the rename:

```json
{ "src/save-button.tsx": { "Save changes": "Guardar" } }
```

The key swaps. The value — your translation — stays.

This is the default behavior when no translator is configured (`preserveTranslationsOnRename` defaults to `true` for you). The translation is technically stale — the source changed — but it's still your real work. Tweak `"Guardar"` to `"Guardar cambios"` in place, instead of starting from a blank stub.

With a translator the default flips to `false`, so renames clear the value and the AI re-translates instantly. Both defaults are right for their context; you almost never set the option explicitly.

Refactor your source aggressively. Your translations follow.

## CI: gate on completeness

The CLI is the same with or without AI:

```bash
yapyak status   # coverage report
yapyak check    # exits 1 if anything is missing — for CI
```

Drop `yapyak check` into your pipeline and the build fails the moment someone adds a `t()` call without filling in every locale.

```yaml
# .github/workflows/ci.yml
- run: npx yapyak check
```

No empty stubs in production.

## Handing off to a translator

The fastest path: snapshot one locale, send the file, get it back, drop it in.

```bash
yapyak export sv > sv.json
```

`sv.json` contains every source string plus the current translation (or empty stub) for each, wrapped with the locale code so the file is self-identifying:

```json
{
  "sv": {
    "src/components/save-button.tsx": {
      "Save changes": ""
    },
    "src/components/cancel-button.tsx": {
      "Cancel": ""
    }
  }
}
```

Each entry has the source string as the key — the translator sees the original directly. Empty values are stubs waiting to be filled; non-empty values are existing translations they can revise.

When you get the file back, unwrap the top key and overwrite `locales/sv.json`:

```bash
jq '.sv' sv.json.translated > locales/sv.json
```

Sending multiple locales to the same translator? List them:

```bash
yapyak export sv nb da > nordics.json
```

All three wrapped in one file, each independent.

## TMS integration

For Crowdin, Lokalise, Phrase, POEditor, Transifex — anything that wants one file per locale in a directory:

```bash
yapyak export --split --out tms-export/
# writes tms-export/en.json, tms-export/sv.json, etc.
```

Each file is wrapped with its locale code, so it travels safely outside `locales/` without losing its identity. Point your TMS at `tms-export/`, do the round-trip, then import the results back into `locales/*.json` (unwrap the top key).

`yapyak export` refuses to write inside `locales/` — that directory is owned by the plugin and represents the canonical on-disk state, not a derived snapshot.

## Mixing manual and AI

Configure a translator and yapyak still respects manual edits in steady state. Translation files are the source of truth — yapyak only fills in **missing** keys on save. Existing entries are never overwritten unless you run `yapyak translate --force`.

This means you can:

- Use AI for the 90% of mundane UI strings
- Hand-edit the 10% that matter (marketing copy, legal, brand voice)
- Re-run `yapyak translate` later — your hand edits survive

**One caveat: renames.** With a translator configured, the default is `preserveTranslationsOnRename: false` — renames clear the value and the AI re-translates. If you've hand-tweaked a translation and don't want it re-translated when you rename the source, either set `preserveTranslationsOnRename: true`, or move the term into [`glossary`](/guide/translators/anthropic#glossary-example) where it's locked across all translations forever.

## When to skip AI entirely

- **Compliance.** Legal, medical, defense — source code can't leave your network. (If you want AI in this setup, see [Ollama](/guide/translators/ollama) for fully local inference.)
- **High-stakes copy.** Marketing taglines, regulated wording, brand-critical microcopy. AI is a starting point, not a finisher.
- **Small surface area.** A 20-string side project doesn't need an API key.
- **Existing translator workflow.** Your TMS and human translators are already wired up. yapyak just becomes the bridge between code and locale files.

The library doesn't care. AI is opt-in. Everything else works the same.
