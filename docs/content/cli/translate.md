---
title: translate
order: 2
---

```
yapyak translate [<locale>] [--force]
```

Fills missing translations in your locale files by running them through the configured [translator](/guide/translating/overview). Without arguments, it processes every locale and every empty stub.

{% switch group="packageManager" %}
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

{% switch group="packageManager" %}
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

Other locales are not touched.

## Re-translate everything with `--force`

By default, `translate` only fills in empty stubs. Existing translations stay where they are. With `--force` (or `-f`), it ignores existing translations and runs everything through the translator again:

{% switch group="packageManager" %}
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

{% callout variant="warning" %}
`--force` overwrites existing translations. If you've hand-edited any locale files, those edits are gone after a forced run. Commit your locale files before running `--force` so you can review or revert the changes.
{% /callout %}

## Requirements

`translate` needs a configured translator. Without one, it errors out with a hint about adding it to `yapyak.config.ts`:

```terminal
  <r>✗</r> <r>No translator configured.</r>

  <d>Add a translator to</d> <c>yapyak.config.ts</c><d>:</d>

    import { anthropic } from '@yapyak/anthropic';

    export default {
      translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),
      // ...
    };
```

## Incremental runs

`translate` is incremental. A run that fails or aborts partway through can be re-run; it resumes from the next empty stub without re-spending tokens on what's already filled. A `YAP0033 TRANSLATE_CHUNK_FAILED` diagnostic indicates a specific batch failed after retries; the other batches still completed. See [Errors](/guide/translating/errors).
