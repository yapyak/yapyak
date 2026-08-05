# Contributing

> Thanks for considering a contribution. This page covers how the repo is laid out, how to run it locally, and how to land a change.

## Prerequisites

- Node.js 22.22 or later
- pnpm 11 — the repo pins `pnpm@11.11.0` through `packageManager`, so `corepack enable` gives you the right version

## Local setup

This is a pnpm monorepo. Install dependencies once:

```bash
pnpm install
```

Then run the verification chain:

```bash
pnpm build      # build every publishable package; tests and typecheck resolve workspace packages through dist
pnpm check      # biome (lint + format)
pnpm typecheck  # tsc across every package
pnpm test       # all unit tests
```

`pnpm check:write` applies biome fixes (formatting, import order) in place. `pnpm test:watch` reruns tests on change, and `pnpm test:coverage` enforces the same thresholds as CI. `pnpm knip` finds unused files, exports, and dependencies.

## End-to-end tests

Playwright drives every example app and the save-loop sandbox. Install its browser once:

```bash
pnpm --filter @yapyak/e2e exec playwright install --with-deps chromium
```

Then, with packages built:

```bash
pnpm e2e:dev   # every example on dev servers, plus the save loop
pnpm e2e:prod  # builds every example and tests the production builds
```

## Style

This repo encodes its conventions in [`AGENTS.md`](AGENTS.md) and the modular rules in [`.agents/skills/`](.agents/skills/). Read those before opening a pull request. Both human contributors and AI-assisted contributors are expected to follow them.

## Pull requests

1. Open against `main`.
2. Add or update tests for behavioral changes.
3. Update documentation when public API changes.
4. Keep the diff scoped — one concern per PR.

CI runs the verification chain on Linux, macOS, and Windows, plus coverage thresholds, `pnpm knip`, and both e2e modes.

For bugs and feature requests, open a GitHub issue. For security vulnerabilities, see [`SECURITY.md`](SECURITY.md). For conduct concerns, see [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
