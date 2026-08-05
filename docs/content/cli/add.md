---
title: add
order: 1
---

```bash
yapyak add <locale> [<locale>...]
```

Adds one or more locales to your project. Each one becomes a new `<locale>.json` file in your [`localesDir`](/guide/getting-started/configuration#localesdir) (default `locales/`) and updates the generated `Locale` type so the new locale is recognised at compile time. If a translator is configured, the new files are filled with translations of every existing source string.

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak add sv
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak add sv
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak add sv
```
{% /when %}
{% /switch %}

The usual case: add Swedish, and the model fills `locales/sv.json` with translations of everything you've already written.

## Adding several at once

Pass multiple locale codes to add them in a single run:

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak add sv de fr ja pt-BR
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak add sv de fr ja pt-BR
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak add sv de fr ja pt-BR
```
{% /when %}
{% /switch %}

This is cheaper than running `add` once per locale. yapyak batches the translation requests across all the new locales together, so the translator sees every target language in each request and can produce all of them at once.

## Locale codes

The argument is a [BCP 47 tag](/guide/switching/tags). The CLI validates its primary language subtag against the ISO 639-1 list — region and script subtags like `sv-SE` or `zh-Hant` pass through, and three-letter (ISO 639-2/3) or `x-` private-use subtags are accepted too. It suggests a correction when the language subtag isn't recognized:

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak add svenska
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak add svenska
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak add svenska
```
{% /when %}
{% /switch %}

```terminal
  <r>✗</r> <r>Invalid locale code.</r>
    <d>svenska is not a recognized ISO 639-1 language code. Did you mean</d> <c>sv</c><d>?</d>
```

Regional variants (`pt-BR`, `zh-Hant`, `en-GB`) work too. The CLI normalizes case through `Intl.Locale` before validation.

## What `add` does, in order

1. Validates every locale code, abort if any are unrecognized.
2. Creates an empty `<locale>.json` file in your `localesDir` for each new locale, scoped per-source-file the same way other locale files are.
3. Runs the [translator](/guide/translating/overview), if configured, to fill the new files with translations of every existing source string.
4. Regenerates `.yapyak/types.d.ts` so the new locales appear in the [`Locale`](/guide/switching/overview) literal union.

If you don't have a translator configured, step 3 is skipped. The new files have empty stubs you fill in yourself.

## When the locale already exists

If you pass a locale that already has a JSON file, `add` reconciles it: any empty stubs get filled, existing ones are left alone. The run is incremental — re-running after a network or rate-limit interruption picks up only the entries still missing.
