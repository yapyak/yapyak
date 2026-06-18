---
title: translate
order: 2
---

```
yapyak translate [<locale>] [--force]
```

Fills missing translations in your locale files by running them through the configured [translator](/guide/translators/overview). Without arguments, it processes every locale and every missing entry. Useful when:

- The dev-time save loop held back auto-translation because a save crossed [`autoTranslateThreshold`](/guide/getting-started/configuration#autotranslatethreshold) (default 20 new strings)
- You're running translation as part of a CI pipeline rather than at dev time
- You disabled auto-translation deliberately and translate in batches

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
pnpm yapyak translate
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak translate
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak translate
```
{% /when %}
{% /switch %}

## A specific locale

Pass a locale to only translate that one:

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
pnpm yapyak translate sv
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak translate sv
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak translate sv
```
{% /when %}
{% /switch %}

Useful when one locale is significantly behind and you want to catch it up without touching the others. Or when you're A/B-testing voice settings against a single language before applying them everywhere.

## Re-translate everything with `--force`

By default, `translate` only fills in empty stubs — existing translations stay where they are. With `--force` (or `-f`), it ignores existing translations and runs everything through the translator again:

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
pnpm yapyak translate --force
pnpm yapyak translate sv -f
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak translate --force
npx yapyak translate sv -f
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak translate --force
bunx yapyak translate sv -f
```
{% /when %}
{% /switch %}

Reach for this when:

- You changed your [voice setting](/guide/translators/overview#voice) and want all translations re-done with the new tone
- You updated the [glossary](/guide/translators/overview#glossary) and need existing translations to respect the new pinned terms
- You're switching providers (from Anthropic to OpenAI, say) and want a clean redo

{% callout variant="warning" %}
`--force` overwrites existing translations. If you've hand-edited any locale files, those edits are gone after a forced run. Commit your locale files before running `--force` so you can review or revert the changes.
{% /callout %}

## Requirements

`translate` needs a configured translator. Without one, it errors out with a hint about adding it to `yapyak.config.ts`:

```bash
$ pnpm yapyak translate
  ✗ No translator configured.

  Add a translator to yapyak.config.ts:

    import { anthropic } from '@yapyak/anthropic';

    export default {
      translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),
      // ...
    };
```

If you want to fill in translations by hand or paste them from somewhere else, just edit the locale files directly. yapyak watches them and refreshes the browser when they change.

## How it differs from the save-time loop

The dev-time auto-translate that runs on save is the same translator, but it works incrementally — only the strings that just changed get sent. `yapyak translate` walks every locale file, finds every empty stub, and processes all of them in one go.

The two paths share results: a translation done by the save loop is found by `yapyak translate` as already filled in (and skipped), and the reverse holds too.

## In CI

A typical pattern: hold back auto-translation in dev (set `autoTranslateThreshold: 0`), let developers write `t()` calls freely, then run `yapyak translate` in CI before building:

```yaml [.github/workflows/build.yml]
- run: pnpm yapyak translate
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
- run: pnpm yapyak check    # gate the build on full coverage
- run: pnpm build
```

This keeps API costs predictable, centralizes the translation step, and avoids surprises where a developer's local environment is missing a key.

## Common issues

- **The run hung partway through.** Re-run — `translate` is incremental, so it resumes where it stopped without re-spending tokens on already-translated strings.
- **A `YAP0033 TRANSLATE_CHUNK_FAILED` appears.** A specific batch failed after retries. The other batches still completed. Re-run to retry the failed ones; if it persists, check the translator's `maxRetries` and `concurrency` settings.
- **Translations look weird after `--force`.** Your `voice` or `glossary` settings changed since you last translated. That's the point — review the new output, adjust the voice or glossary if needed, run `--force` again.

## See also

- [Translators — Overview](/guide/translators/overview) — voice, glossary, context, batching
- [check](/guide/cli/check) — gate CI on translation completeness
- [Config — autoTranslateThreshold](/guide/getting-started/configuration#autotranslatethreshold) — the dev-time guardrail this command exists to complement
- [export](/guide/cli/export) — snapshot translations for an external translator or review
