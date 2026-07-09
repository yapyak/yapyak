---
title: status
order: 4
---

```bash
yapyak status [--json]
```

Reports translation coverage per locale. How many strings are translated, how many are still missing. Read-only; doesn't modify any files.

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak status
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak status
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak status
```
{% /when %}
{% /switch %}

```terminal
  <b>Translation status</b>
  <d>Locales</d>   <b>en</b> <d>(default)</d> <d>·</d> <b>sv</b>
  <d>Total</d>     <b>521</b> messages × 2 = <b>1042</b> translations

  ┌──────────────┬───────────┬────────────────────────────────────┐
  │ <b>Locale</b>       │  <b>Coverage</b> │                                    │
  ├──────────────┼───────────┼────────────────────────────────────┤
  │ en <d>(default)</d> │ 521 / 521 │ ████████████████████ 521/521  100% │
  │ sv           │ 521 / 521 │ ████████████████████ 521/521  100% │
  └──────────────┴───────────┴────────────────────────────────────┘

  <g>✔</g> <g>All translations present.</g>
```

Each row shows the locale, how many translations exist out of the total, a progress bar, and the percentage. `defaultLocale` is always 100% since every source string is by definition translated to itself.

## Machine-readable output

For CI dashboards, monitoring, or anything that consumes the output programmatically, use `--json`:

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak status --json
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak status --json
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak status --json
```
{% /when %}
{% /switch %}

```terminal
{
  "defaultLocale": "en",
  "locales": ["de", "en", "ja", "sv"],
  "totalMessages": 124,
  "perLocale": {
    "en": { "translated": 124, "missing": 0 },
    "sv": { "translated": 108, "missing": 16 },
    "de": { "translated": 51, "missing": 73 },
    "ja": { "translated": 8, "missing": 116 }
  },
  "missing": [/* per-locale per-source entries */],
  "diagnostics": [/* any YAP diagnostics from extraction */]
}
```

The structure is stable across yapyak versions. Safe to parse from scripts.

## What counts as "translated"

A locale entry counts as translated when its value isn't an empty string. yapyak doesn't try to judge quality. A one-character translation counts as translated. Use `status` to track that translations exist, and your own review process (PRs, manual review, a linguist's sign-off) to track that they're good.

For [homonyms](/guide/writing/homonyms) (`t.as('action', 'Open')`), each context counts as a separate entry. A source string with three contexts contributes three entries to the total per locale.

## What `status` doesn't tell you

A few things `status` deliberately leaves out:

- **Quality.** Whether the translations read well is a human judgment.
- **Consistency across locales.** Two locales may have wildly different totals if you've been adding strings in one before the other catches up.
- **Diagnostics.** If a translation has a malformed ICU placeholder or a missing parameter, [`yapyak check`](/reference/cli/check) is what you want.

## Exit codes

`status` exits non-zero (`1`) when any translations are missing, zero otherwise. Same for `--json`. To parse the JSON and decide yourself, redirect output and inspect the `perLocale.<locale>.missing` count.
