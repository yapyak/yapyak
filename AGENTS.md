# yapyak

`yapyak` is a Vite-first i18n library. The runtime translation function is `t()`. The core package publishes **unscoped** as `yapyak`. Framework adapters, translator providers, and the Vite plugin publish as **public** scoped packages under `@yapyak/*` (e.g. `@yapyak/react`, `@yapyak/vite`, `@yapyak/anthropic`). Internal-only workspace packages are also `@yapyak/*` but marked `private` — `@yapyak/typescript-config`, `@yapyak/tsdown-config`, `@yapyak/vitest-config`, `@yapyak/doc-compiler`, `@yapyak/docs`, `@yapyak/e2e`.

## Project layout

- `packages/yapyak/` — the published `yapyak` package: runtime (`t()`), compiler, CLI, config, locale resolution, persistence, formatting, diagnostics
- `packages/vite/` — `@yapyak/vite`, the Vite plugin
- `packages/{react,react-router,vue,svelte,sveltekit,tanstack-start,astro}/` — framework adapters (`@yapyak/<framework>`)
- `packages/{anthropic,gemini,ollama,openai}/` — LLM translator providers (`@yapyak/<provider>`)
- `packages/{typescript-config,tsdown-config,vitest-config}/` — shared build/test config
- `packages/doc-compiler/` — `@yapyak/doc-compiler`, doc-compilation tooling
- `docs/` — `@yapyak/docs`, Vite + TanStack Start app
- `examples/*` — minimal demos named by their stack
- `e2e/` — `@yapyak/e2e`, Playwright end-to-end tests for the example apps and the save loop (`pnpm e2e:dev`, `pnpm e2e:prod`); `e2e/sandbox/` is the mutable fixture app the save-loop tests write to

## Architecture invariants

### `yapyak/internal` subpath

`yapyak/internal` is a public subpath that only exists for the Vite plugin's emitted code (transformed `t()` calls). Users never import from it manually. Its exports are the runtime side of the compiler — calling them directly bypasses placeholder type-checking the plugin enforces at compile time.

## Workflow

Always run `pnpm check:write` after changes.

## Rule modules

Detailed conventions live as portable **Agent Skills** in `.agents/skills/` — each skill carries its full prose, auto-routed by description across Claude Code, Codex, Cursor, and 40+ tools (symlinked into `.claude/skills/`). Cross-references use `[[yapyak-*]]` skill names. Always consult `yapyak-workflow` (how to work) and `yapyak-style` (how skills are written).

- **Code:** `yapyak-type` · `yapyak-name` · `yapyak-module` · `yapyak-nullability` · `yapyak-comment`
- **Library:** `yapyak-visibility` · `yapyak-package` · `yapyak-jsdoc`
- **Testing:** `yapyak-test`
- **Yapyak-specific:** `yapyak-diagnostic` · `yapyak-terminology`
- **App (`docs/`):** `yapyak-react` · `yapyak-box` · `yapyak-css` · `yapyak-element-type` · `yapyak-tanstack-start` · `yapyak-app` · `yapyak-documentation`
- **Infra:** `yapyak-ci` · `yapyak-dependency`
- **Process:** `yapyak-workflow` · `yapyak-style`
