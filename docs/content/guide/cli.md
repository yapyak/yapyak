---
title: CLI
order: 6
---

The Vite plugin handles the dev loop: edit a string, save, translations update. The CLI handles everything that happens outside that loop — adding locales, re-translating after a voice change, snapshotting for handoff, gating CI on completeness.

Run it via `npx yapyak` or `pnpm yapyak`.

## Commands at a glance

| Command | What it does |
| --- | --- |
| `yapyak add <locale...>` | Create locale files and translate every `t()` string |
| `yapyak translate [locale]` | Fill missing entries for one or all locales |
| `yapyak status` | Coverage report per locale |
| `yapyak check` | Exit 1 if anything's missing (for CI) |
| `yapyak export` | Snapshot locales as JSON for handoff |

The CLI reads the same `vite.config.ts` as the plugin. Same translator config, same locales directory, same default locale.

## Add a language

```bash
npx yapyak add fr
```

Creates `locales/fr.json` and translates every `t()` string into French. Add multiple at once:

```bash
npx yapyak add fr de ja
```

If the file already exists, `add` leaves it alone and only fills missing entries.

## Re-translate after a voice change

You updated `voice:` in your translator config and want every existing translation regenerated with the new tone.

```bash
npx yapyak translate --force
```

Without `--force`, `translate` only fills missing entries. With it, every entry is re-translated, including ones already populated.

Target a single locale:

```bash
npx yapyak translate sv --force
```

Pick a provider explicitly if you have credentials for both Anthropic and OpenAI:

```bash
npx yapyak translate --provider=openai
```

## Check coverage

```bash
npx yapyak status
```

Prints a table with one row per locale and a progress bar showing translated / total. Use this when you want a quick read on where the project stands.

For scripts and dashboards, get JSON:

```bash
npx yapyak status --json
```

Exits 1 if anything is missing, 0 if complete.

## Gate CI on completeness

```bash
npx yapyak check
```

Exits 1 with a per-locale list of missing strings if any locale is incomplete. Drop it into your build pipeline before `vite build`:

```yaml
- run: npx yapyak check
- run: pnpm build
```

Two CI patterns work well here. Either pre-translate locally and commit `locales/*.json` (no API keys in CI), or set your translator's API key as a CI secret and let `vite build` translate during the build. Pre-translating is the safer default.

## Snapshot for handoff

Sending translations to a human translator, syncing to a CMS, or producing a versioned artifact for a release?

```bash
npx yapyak export --out=snapshot.json
```

Writes one JSON file containing every locale, every string, in the same shape as `locales/*.json` but combined.

Filter to specific locales:

```bash
npx yapyak export sv fr --out=snapshot.json
```

Split into one file per locale (useful for translator tooling that expects per-language uploads):

```bash
npx yapyak export --split --out=handoff/
```

Produces `handoff/sv.json`, `handoff/fr.json`, etc.

Without `--out`, the snapshot prints to stdout. Pipe it anywhere:

```bash
npx yapyak export sv | jq '.sv'
```

`export` refuses to write inside `locales/` — that directory is owned by the plugin.

## Reference

### `add <locale...>`

Creates locale files and translates every `t()` string into each target language. Existing files are left alone and only their missing entries are filled.

### `translate [locale]`

Fills missing translations. Without an argument, processes every non-default locale.

| Flag | Effect |
| --- | --- |
| `--force` / `-f` | Re-translate every entry, including existing ones |
| `--provider=anthropic` | Force Anthropic even if both keys are present |
| `--provider=openai` | Force OpenAI even if both keys are present |

Reads API keys from `.env.local` (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY`).

### `status`

Prints a coverage table per locale.

| Flag | Effect |
| --- | --- |
| `--json` | Machine-readable output. Exits 1 if any missing, 0 otherwise. |

### `check`

Exits 1 with a list of missing strings if any locale is incomplete. Exits 0 if everything is translated. Designed for CI.

### `export [locale...]`

Writes a JSON snapshot of every translated string. With no locale arguments, includes every locale.

| Flag | Effect |
| --- | --- |
| `--out=<path>` | Write to a file instead of stdout |
| `--split` | One file per locale (requires `--out=<dir>`) |

Refuses to write inside the configured `localesDir`.

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | Missing translations, invalid arguments, or translator failure |
