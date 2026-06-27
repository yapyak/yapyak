# yapyak

`yapyak` is a Vite-first i18n library. The runtime translation function is `t()`. The core package publishes **unscoped** as `yapyak`. Framework adapters, translator providers, and the Vite plugin publish as **public** scoped packages under `@yapyak/*` (e.g. `@yapyak/react`, `@yapyak/vite`, `@yapyak/anthropic`). Internal-only workspace packages are also `@yapyak/*` but marked `private` — `@yapyak/typescript-config`, `@yapyak/tsdown-config`, `@yapyak/vitest-config`, `@yapyak/doc-compiler`, `@yapyak/docs`.

## Project layout

This is a multi-package monorepo, not a single library.

- `packages/yapyak/` — the published `yapyak` package: runtime (`t()`), compiler, CLI, config, locale resolution, persistence, formatting, diagnostics
- `packages/vite/` — `@yapyak/vite`, the Vite plugin (the "Vite-first" entry point; depends on `yapyak`'s compiler)
- `packages/{react,react-router,vue,svelte,sveltekit,tanstack-start,astro}/` — framework adapters (`@yapyak/<framework>`)
- `packages/{anthropic,gemini,ollama,openai}/` — LLM translator providers (`@yapyak/<provider>`)
- `packages/{typescript-config,tsdown-config,vitest-config}/` — shared build/test config, private (`@yapyak/*`)
- `packages/doc-compiler/` — `@yapyak/doc-compiler`, private doc-compilation tooling
- `docs/` — `@yapyak/docs`, Vite + TanStack Start docs site, private
- `examples/*` — minimal demos named by their stack, e.g. `react-tanstack-start-cookie`, `svelte-sveltekit-url`, `vue-vanilla-local-storage`, `astro-cookie`

## Architecture invariants

### `yapyak/internal` subpath

`yapyak/internal` is a public subpath that **only** exists for the Vite plugin's emitted code (transformed `t()` calls). Users should never import from it manually. Its exports are the runtime side of the compiler — calling them directly bypasses placeholder type-checking the plugin enforces at compile time.

## Workflow

Always run `pnpm check:write` after changes.

## Conventions

Every file in `agents/` is a standalone rule module. Each is the source of truth for its topic.

### Operating

- [agents/general.md](agents/general.md) — broad principles: verify against code, consistency, leave nothing behind
- [agents/working-with-user.md](agents/working-with-user.md) — stop signals, defaults, ambiguity, layering

### Code

- [agents/base.md](agents/base.md) — TypeScript baseline (`type` vs `interface`, branding, exhaustiveness)
- [agents/naming.md](agents/naming.md) — files, folders, symbols, closed vocabularies
- [agents/imports.md](agents/imports.md) — relative vs alias, library exception via barrels
- [agents/comments.md](agents/comments.md) — biome-ignore convention, `@ts-nocheck` fixture exception
- [agents/null-vs-undefined.md](agents/null-vs-undefined.md) — mechanical choice rule
- [agents/diagnostics.md](agents/diagnostics.md) — `YAP00xx` code format, allocation, doc URLs

### Library

- [agents/library.md](agents/library.md) — library-level conventions (visibility, public surface)
- [agents/jsdoc.md](agents/jsdoc.md) — TSDoc, formula tables, package identifier table
- [agents/package-json.md](agents/package-json.md) — field order, `exports` rules, package README convention
- [agents/dependencies.md](agents/dependencies.md) — what to depend on, peer ranges

### UI

- [agents/client.md](agents/client.md) — browser-only constraints
- [agents/react.md](agents/react.md) — props, components, JSX rules

### Testing

- [agents/testing.md](agents/testing.md) — decision tree, formula tables, Yap List, Yak Pool, property-based testing, coverage exclusion convention

### Build

- [agents/tsdown.md](agents/tsdown.md) — tsdown config conventions

### Docs

- [agents/docs.md](agents/docs.md) — guide-site voice, anti-tells, vocabulary, code-block conventions, framework switching
- [agents/terminology.md](agents/terminology.md) — binding terminology table: same concept, same word, every page
