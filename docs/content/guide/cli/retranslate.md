---
title: retranslate
order: 3
---

```
yapyak retranslate <source> [--locale <code>] [--as <ctx>] [--file <path>]
```

Re-translates one specific source string, ignoring any existing translation. Targeted alternative to `translate --force`. Only the call sites matching the source you name go through the translator.

Reach for it when:

- You changed your mind about a single word's translation and want a fresh take from the translator
- A glossary update should propagate to one specific term without re-translating the whole catalog
- You're tuning translations one string at a time and want to iterate cheaply

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak retranslate "Save"
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak retranslate "Save"
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak retranslate "Save"
```
{% /when %}
{% /switch %}

By default, every locale (other than the default locale) gets a fresh translation for the matching source string. Existing values are overwritten.

## A single locale

Pass `--locale` to limit the re-translation to one target:

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak retranslate "Save" --locale sv
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak retranslate "Save" --locale sv
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak retranslate "Save" --locale sv
```
{% /when %}
{% /switch %}

Other locales keep their existing translation untouched.

## A disambiguated source

For source strings written with `t.as(ctx, source)`, pass `--as` to target one variant (the flag mirrors the API):

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak retranslate "Open" --as badge
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak retranslate "Open" --as badge
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak retranslate "Open" --as badge
```
{% /when %}
{% /switch %}

Other variants of the same source (e.g., `t.as('action', 'Open')`) keep their existing translation.

## A specific call site

When the same source appears in multiple files, pass `--file` to target one:

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak retranslate "Save" --file src/profile/form.tsx
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak retranslate "Save" --file src/profile/form.tsx
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak retranslate "Save" --file src/profile/form.tsx
```
{% /when %}
{% /switch %}

Other call sites of `t('Save')` in other files keep their existing translation. The path is the same `fileId` that appears as a key in the locale JSON files.

`--locale`, `--as`, and `--file` compose. `--locale sv --as badge --file src/a.tsx` re-translates exactly one cell of the matrix.

## How it differs from `translate --force`

`translate --force` re-translates **every** stub in **every** locale. `retranslate` re-translates exactly the call sites matching the source you name. Minimal API spend, surgical scope.

| Goal | Use |
|---|---|
| Glossary changed, every translation should respect it | `translate --force` |
| Voice changed, want the whole catalog redone | `translate --force` |
| One word's translation feels wrong | `retranslate "<that word>"` |
| Single locale needs a single word redone | `retranslate "<word>" --locale sv` |
| Only one file's call site should be tweaked | `retranslate "<word>" --file <path>` |

## Requirements

`retranslate` needs a configured translator. Without one, it errors out the same way `translate` does. See [translate](/guide/cli/translate#requirements) for the setup hint.

## No matching call sites

If the source string you pass doesn't appear in any `t()` or `t.as()` call in the project (or no call site matches the `--file` / `--as` filter), `retranslate` returns `0` without touching anything:

```bash
$ pnpm yapyak retranslate "Greetings"

  Re-translating
  "Greetings"

  ✓ No matching call sites.
```

Check the spelling and that the source string matches a call site literal exactly (including casing and punctuation).
