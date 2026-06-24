---
title: status
order: 4
---

```
yapyak status [--json]
```

Reports translation coverage per locale — how many strings are translated, how many are still missing. Read-only; doesn't modify any files.

```bash
$ pnpm yapyak status

  Translation status

  Locales   en (default) · sv · de · ja
  Total     124 messages × 4 = 496 translations

  Locale          Coverage
  en (default)   124 / 124   ████████████████████  100%
  sv             108 / 124   █████████████████░░░  87%
  de              51 / 124   █████████░░░░░░░░░░░  41%
  ja               8 / 124   █░░░░░░░░░░░░░░░░░░░  6%
```

Each row shows the locale, how many translations exist out of the total, a progress bar, and the percentage. `defaultLocale` is always 100% since every source string is by definition translated to itself.

## Machine-readable output

For CI dashboards, monitoring, or anything that consumes the output programmatically, use `--json`:

```bash
$ pnpm yapyak status --json
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

The structure is stable across yapyak versions — safe to parse from scripts.

## What counts as "translated"

A locale entry counts as translated when its value isn't an empty string. yapyak doesn't try to judge quality — a one-character translation counts as translated. Use `status` to track that translations exist, and your own review process (PRs, manual review, a linguist's sign-off) to track that they're good.

For [homonyms](/guide/writing/homonyms) (`t.as('action', 'Open')`), each context counts as a separate entry. A source string with three contexts contributes three entries to the total per locale.

## What `status` doesn't tell you

A few things `status` deliberately leaves out:

- **Quality.** Whether the translations read well is a human judgment.
- **Consistency across locales.** Two locales may have wildly different totals if you've been adding strings in one before the other catches up.
- **Diagnostics.** If a translation has a malformed ICU placeholder or a missing parameter, [`yapyak check`](/guide/cli/check) is what you want.

## In CI

`status` is informational — `check` is what you gate on. A common pattern is to log status output before running `check` so the report is visible in CI logs:

```yaml
- run: pnpm yapyak status
- run: pnpm yapyak check
```

The `status` step gives a quick visual of where coverage stands; `check` is what fails the build if something's missing.

## Exit codes and conventions

`status` exits non-zero (`1`) when any translations are missing, zero otherwise. Same for `--json`. If you want a soft check that always exits zero, parse the JSON and decide yourself.

All yapyak CLI commands share two conventions:

- **Flag values can use `=`.** `--write`, `--write=true`, `--write=yes`, `--write=false`, `--write=0`, and `--write=off` are all valid for boolean flags. Useful when piping shell variables: `pnpm yapyak clean --write=$SHOULD_WRITE`.
- **Color output respects the environment.** Set `NO_COLOR` to disable color anywhere; set `CI` (most CI runners do automatically) and yapyak strips color too.
