---
title: CLI
---

yapyak's CLI runs through your project's `yapyak` binary. Invoke any command through your package manager: `pnpm yapyak <command>`, `npx yapyak <command>`, or `bunx yapyak <command>`.

## Commands

| Command | Purpose |
|---|---|
| [`add`](/reference/cli/add) | Add one or more locales |
| [`translate`](/reference/cli/translate) | Fill missing translations |
| [`retranslate`](/reference/cli/retranslate) | Re-translate a single source string |
| [`status`](/reference/cli/status) | Report translation coverage |
| [`check`](/reference/cli/check) | Validate translations and gate CI |
| [`clean`](/reference/cli/clean) | Remove orphan entries from locale files |
| [`export`](/reference/cli/export) | Export translations as JSON |
| [`info`](/reference/cli/info) | Print the environment for bug reports |

## Conventions

All commands share two conventions:

- **Flag values accept `=`.** `--write`, `--write=true`, `--write=yes`, `--write=false`, `--write=0`, and `--write=off` are all valid for boolean flags. Useful when piping shell variables: `pnpm yapyak clean --write=$SHOULD_WRITE`.
- **Color output respects the environment.** Set `NO_COLOR` to disable color anywhere. `CI` (set automatically by most CI runners) strips color too.
