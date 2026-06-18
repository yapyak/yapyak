---
title: add
order: 1
---

```
yapyak add <locale> [<locale>...]
```

Adds one or more locales to your project. Each one becomes a new `<locale>.json` file in your [`localesDir`](/guide/getting-started/configuration#localesdir) (default `locales/`), updates the generated `Locale` type so the new locale is recognised at compile time, and — if a translator is configured — fills the new files with translations of every existing source string.

{% switch group="pkg" %}
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

That's the usual case: add Swedish, the model fills `locales/sv.json` with translations of everything you've already written.

## Adding several at once

Pass multiple locale codes to add them in a single run:

{% switch group="pkg" %}
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

This is cheaper than running `add` once per locale — yapyak batches the translation requests across all the new locales together, so the translator sees every target language in each request and can produce all of them at once.

## Locale codes

The argument is a [BCP 47 tag](/guide/locale/tags). The CLI validates against the ISO 639-1 language list, with a helpful suggestion when it doesn't recognize the code:

```bash
$ pnpm yapyak add svenska
  ✗ Invalid locale code.
    svenska is not a recognized ISO 639-1 language code. — did you mean sv?
```

Regional variants (`pt-BR`, `zh-Hant`, `en-GB`) work too — the CLI normalizes case through `Intl.Locale` before validation.

## What `add` does, in order

1. Validates every locale code, abort if any are unrecognized.
2. Creates an empty `<locale>.json` file in your `localesDir` for each new locale, scoped per-source-file the same way other locale files are.
3. Runs the [translator](/guide/translators/overview), if configured, to fill the new files with translations of every existing source string.
4. Regenerates `.yapyak/types.d.ts` so the new locales appear in the [`Locale`](/guide/getting-started/installation) literal union.

If you don't have a translator configured, step 3 is skipped — the new files have empty stubs you fill in yourself.

## When the locale already exists

If you pass a locale that already has a JSON file, `add` reconciles it: any empty stubs get filled, existing ones are left alone. Useful for catching a locale up after you've held back auto-translation deliberately.

In practice you use `add` once per new locale and then rely on the [dev-time save loop](/guide/getting-started/how-it-works#the-save-loop) or [`yapyak translate`](/guide/cli/translate) for ongoing translation work.

## Common issues

- **The translator ran out partway through.** Network or rate-limit issue. Re-run `yapyak add <locale>` — it picks up where it left off, only translating the entries that are still missing.
