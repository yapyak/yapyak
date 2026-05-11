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

```tsx
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

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

When a translator is configured, yapyak treats the entry as stale and re-translates it in the background, so "Guardar" gets refreshed to "Guardar cambios" a beat later. **Without a translator, there's no background pass.** The old value stays put under the new key forever, or until you edit it yourself. It's technically stale (the English changed), but no work is lost — you tweak `"Guardar"` to `"Guardar cambios"` in place, instead of starting from a blank stub.

Refactor your English aggressively. Your translations follow.

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

## TMS integration

`locales/*.json` is plain JSON keyed by file path, then by source string. Any translation management system that handles flat or nested JSON works:

- **Crowdin** — point a source file pattern at `locales/en.json` (or export a flat copy)
- **Lokalise** — JSON connector reads the structure as-is
- **Phrase / POEditor / Transifex** — same

Round-trip: export `locales/*.json` to your TMS, translators do their work, import the result back. Commit. yapyak's structure stays intact because the keys are stable (file path + source string), not opaque IDs that shift around.

## Mixing manual and AI

Configure a translator and yapyak still respects manual edits. Translation files are the source of truth — yapyak only fills in **missing** keys on save. Existing entries are never overwritten unless you run `yapyak translate --force`.

This means you can:

- Use AI for the 90% of mundane UI strings
- Hand-edit the 10% that matter (marketing copy, legal, brand voice)
- Re-run `yapyak translate` later — your hand edits survive

The position-aware rename detection works the same way whether the translation was written by AI or by you.

## When to skip AI entirely

- **Compliance.** Legal, medical, defense — source code can't leave your network. (If you want AI in this setup, see [Ollama](/guide/translators/ollama) for fully local inference.)
- **High-stakes copy.** Marketing taglines, regulated wording, brand-critical microcopy. AI is a starting point, not a finisher.
- **Small surface area.** A 20-string side project doesn't need an API key.
- **Existing translator workflow.** Your TMS and human translators are already wired up. yapyak just becomes the bridge between code and locale files.

The library doesn't care. AI is opt-in. Everything else works the same.
