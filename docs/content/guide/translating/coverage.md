---
title: Coverage
order: 8
---

Coverage is the share of your source strings that have a non-empty translation in each locale.

```bash
$ pnpm yapyak status

  Translation status

  Locales   en (default) · sv · de
  Total     124 messages × 3 = 372 translations

  Locale          Coverage
  en (default)   124 / 124   ████████████████████  100%
  sv             108 / 124   █████████████████░░░  87%
  de              51 / 124   █████████░░░░░░░░░░░  41%
```

`defaultLocale` is always 100%: every source string is its own translation.

## Filling the gaps

[`yapyak translate`](/reference/cli/translate) walks every locale file, finds every empty stub, and runs them through the configured translator. Existing translations stay where they are.

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

Pass a locale to scope the run to one target:

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

`yapyak translate` is incremental. A run that fails partway through resumes from the next empty stub without re-spending tokens on what's already filled.

## When to run

Two situations reach for `translate` rather than the [save loop](/guide/translating/loop):

- A save crossed [`autoTranslateThreshold`](/guide/translating/loop#the-threshold-guardrail) and the loop held off. Run `translate` when you're ready.
- You translate in CI rather than at dev-time, to keep API costs in one predictable place.

## Force re-translate

`--force` ignores existing translations and runs every entry through the translator again. Use it after a [voice](/guide/translating/voice) or [glossary](/guide/translating/glossary) change you want propagated everywhere:

```bash
pnpm yapyak translate --force
```

{% callout variant="warning" %}
`--force` overwrites hand-edits. Commit your locale files before running it so you can review or revert.
{% /callout %}

For a single source string, [`yapyak retranslate`](/reference/cli/retranslate) is the targeted alternative. It re-translates exactly the call sites matching the source you name.

## Gating CI

[`yapyak check`](/reference/cli/check) exits non-zero when any locale has missing translations, mismatched ICU placeholders, or other extraction diagnostics. Wire it into your build pipeline:

```yaml [.github/workflows/build.yml]
- run: pnpm yapyak translate
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
- run: pnpm yapyak check
- run: pnpm build
```

A failed check stops the pipeline before a half-translated bundle is built.

## Status and check

| Goal | Reach for |
|---|---|
| See a coverage breakdown across locales | `yapyak status` |
| Get a machine-readable coverage report | `yapyak status --json` |
| Fail CI on any missing or broken translation | `yapyak check` |

`status` is informational. `check` is gating. A common pattern is to log `status` before `check` so the report is visible in CI logs even when the build passes.

## New locales

[`yapyak add <locale>`](/reference/cli/add) creates the locale file and, if a translator is configured, fills every existing source string in one run. Same path as `translate`, but scoped to a new locale and run once.

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

Pass multiple locales to batch them; the translator sees every target language together and produces all of them in fewer requests.
