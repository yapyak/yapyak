# Contributing

> Thanks for considering a contribution. This page covers how the repo is laid out, how to run it locally, and how to land a change.

## Local setup

This is a pnpm monorepo. Install dependencies once:

```bash
pnpm install
```

Then run the verification chain:

```bash
pnpm build         # build every package; tests and typecheck resolve workspace packages through dist
pnpm test          # all tests
pnpm check         # biome (lint + format)
pnpm -r typecheck  # tsc across every package
```

`pnpm check:write` applies biome fixes (formatting, import order) in place.

## Style

This repo encodes its conventions in [`AGENTS.md`](AGENTS.md) and the modular rules in [`.agents/skills/`](.agents/skills/). Read those before opening a pull request. Both human contributors and AI-assisted contributors are expected to follow them.

## Pull requests

1. Open against `main`.
2. Add or update tests for behavioral changes.
3. Update documentation when public API changes.
4. Keep the diff scoped — one concern per PR.

For bugs and feature requests, open a GitHub issue. For security vulnerabilities, see [`SECURITY.md`](SECURITY.md). For conduct concerns, see [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
