---
title: CLI
order: 2
---

The `yapyak` CLI runs the same compiler and translator used by the Vite plugin, on demand. Use it from your terminal, from a script, or from CI.

## add

Add one or more locales to the project and translate everything for them:

```bash
yapyak add fr
yapyak add fr de sv
```

Creates the locale files under `locales/` and runs the configured translator across all extracted messages.

## translate

Fill missing translations against the configured translator:

```bash
yapyak translate              # all locales
yapyak translate sv           # one locale
yapyak translate --force      # re-translate everything, including filled values
```

## status

Report translation coverage per locale:

```bash
yapyak status                 # human-readable table
yapyak status --json          # machine-readable, exits 1 if any missing
```

Use `--json` from CI when you want a structured report alongside the exit code.

## check

Validate locale files and exit non-zero if anything is missing:

```bash
yapyak check
```

This is the canonical CI gate. It runs the same validation as the Vite plugin and checks completeness across all configured locales. See [Diagnostics](/guide/translations/diagnostics) for the full code list.

## clean

Find orphan entries — translations whose source `t()` call has been deleted from the code:

```bash
yapyak clean                  # list orphans only
yapyak clean --write          # remove orphans from the locale files
```

Without `--write`, prints the list and exits.

## export

Snapshot locale files for handoff to an external system:

```bash
yapyak export                 # all locales to stdout
yapyak export sv              # one locale to stdout
yapyak export --out=snapshot.json    # write to a file
yapyak export --split --out=./out    # one file per locale in directory
```

`--split` requires `--out=<dir>`. The snapshot format matches the on-disk locale-file format.
