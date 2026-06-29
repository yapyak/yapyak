# @yapyak/docs

A React app on TanStack Start, styled with CSS Modules.

**Extends the repo-root [AGENTS.md](../AGENTS.md)** — every shared rule there applies here too. The modules below add the app-layer stack (React, CSS, TanStack, app-code TypeScript) plus this site's authoring rules. They load only when working in `docs/`; the rule files themselves live in the central `../agents/`.

## Rule modules

### Frontend stack

- [../agents/react.md](../agents/react.md) — components, hooks, refs, JSX rules
- [../agents/box.md](../agents/box.md) — `Box` primitive: render `Box` for every element, `BoxProps<T>`, `data-*` passthrough, `className` forwarding
- [../agents/css-modules.md](../agents/css-modules.md) — CSS Modules class-naming vocabulary, DOM-mirrored nesting, state selectors
- [../agents/css-rules.md](../agents/css-rules.md) — design tokens, units, flex/grid, hover/active gating, even numbers
- [../agents/css-design-tokens.md](../agents/css-design-tokens.md) — two-tier palette → semantic token architecture
- [../agents/tanstack.md](../agents/tanstack.md) — route files, route-scoped hooks, loaders, `.server.ts`, server functions

### App-code TypeScript

- [../agents/app.md](../agents/app.md) — app tsconfig (infer return types, no `isolatedDeclarations`), domain `null` vs UI `undefined` translated at the dispatcher
- [../agents/client.md](../agents/client.md) — browser-side rules: `window.*` timers

### Authoring

- [../agents/docs.md](../agents/docs.md) — guide-site voice, structure, code blocks, framework/package-manager switching
- [../agents/docs-site.md](../agents/docs-site.md) — yapyak ethos, brand conventions, canonical examples, page templates, information hierarchy, terminology lock, tone budget
