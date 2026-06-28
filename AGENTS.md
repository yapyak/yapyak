# yapyak

`yapyak` is a Vite-first i18n library. The runtime translation function is `t()`. The core package publishes **unscoped** as `yapyak`. Framework adapters, translator providers, and the Vite plugin publish as **public** scoped packages under `@yapyak/*` (e.g. `@yapyak/react`, `@yapyak/vite`, `@yapyak/anthropic`). Internal-only workspace packages are also `@yapyak/*` but marked `private` — `@yapyak/typescript-config`, `@yapyak/tsdown-config`, `@yapyak/vitest-config`, `@yapyak/doc-compiler`, `@yapyak/docs`.

## Project layout

- `packages/yapyak/` — the published `yapyak` package: runtime (`t()`), compiler, CLI, config, locale resolution, persistence, formatting, diagnostics
- `packages/vite/` — `@yapyak/vite`, the Vite plugin
- `packages/{react,react-router,vue,svelte,sveltekit,tanstack-start,astro}/` — framework adapters (`@yapyak/<framework>`)
- `packages/{anthropic,gemini,ollama,openai}/` — LLM translator providers (`@yapyak/<provider>`)
- `packages/{typescript-config,tsdown-config,vitest-config}/` — shared build/test config
- `packages/doc-compiler/` — `@yapyak/doc-compiler`, doc-compilation tooling
- `docs/` — `@yapyak/docs`, Vite + TanStack Start docs site
- `examples/*` — minimal demos named by their stack

## Architecture invariants

### `yapyak/internal` subpath

`yapyak/internal` is a public subpath that only exists for the Vite plugin's emitted code (transformed `t()` calls). Users never import from it manually. Its exports are the runtime side of the compiler — calling them directly bypasses placeholder type-checking the plugin enforces at compile time.

## Workflow

Always run `pnpm check:write` after changes.

## Rule modules

Each file in `agents/` is a standalone rule module. Subject-noun, kebab-case, single source of truth for its topic.

### Process

- [agents/workflow.md](agents/workflow.md) — verify, stop signals, "kör" scope, ambiguity, leave nothing behind

### Code

- [agents/types.md](agents/types.md) — type system, unions, defaults, argument shape, error classes, language atoms
- [agents/naming.md](agents/naming.md) — files, folders, symbols, suffixes, verbs, booleans
- [agents/modules.md](agents/modules.md) — imports, exports, barrels, internal subpaths, folder splitting
- [agents/null-vs-undefined.md](agents/null-vs-undefined.md) — mechanical decision tree
- [agents/comments.md](agents/comments.md) — biome-ignore, `@ts-*`

### React

- [agents/react.md](agents/react.md) — components, hooks, refs, JSX rules

### Library

- [agents/visibility.md](agents/visibility.md) — public, semi-public, private, `/internal` subpath
- [agents/packages.md](agents/packages.md) — `package.json`, `exports`, dependencies, `tsdown` build, scope tiers
- [agents/jsdoc.md](agents/jsdoc.md) — TSDoc on public API

### Testing

- [agents/testing.md](agents/testing.md) — Vitest conventions, the Yap List, the Yak Pool, property-based testing

### Yapyak-specific

- [agents/diagnostics.md](agents/diagnostics.md) — `YAP00xx` code format, allocation, doc URLs
- [agents/docs.md](agents/docs.md) — guide-site voice and structure
- [agents/terminology.md](agents/terminology.md) — locked vocabulary
