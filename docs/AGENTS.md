# @yapyak/docs

React app on TanStack Start, CSS Modules. Extends root [AGENTS.md](../AGENTS.md).

## Rule modules

### Frontend stack

- [../agents/react.md](../agents/react.md) — components, hooks, refs, JSX rules
- [../agents/box.md](../agents/box.md) — `Box` primitive: render `Box` for every element, `BoxProps<T>`, `data-*` passthrough, `className` forwarding
- [../agents/css.md](../agents/css.md) — design tokens, CSS Modules class-naming, DOM-mirrored nesting, cascade/units/layout
- [../agents/tanstack-start.md](../agents/tanstack-start.md) — route files, route-scoped hooks, loaders, `.server.ts`, server functions

### App-code TypeScript

- [../agents/app.md](../agents/app.md) — app tsconfig (infer return types, no `isolatedDeclarations`), domain `null` vs UI `undefined` translated at the dispatcher
- [../agents/client.md](../agents/client.md) — browser-side rules: `window.*` timers

### Authoring

- [../agents/docs.md](../agents/docs.md) — guide voice, structure, code blocks, framework switching, plus yapyak ethos, brand, canonical examples, page templates, tone budget
