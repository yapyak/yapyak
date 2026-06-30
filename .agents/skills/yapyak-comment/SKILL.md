---
name: yapyak-comment
description: "Comments: the no-comment rule, functional-comment exceptions, the `biome-ignore` format, `@ts-*` directives. Use when adding a comment or a linter or type-checker suppression."
---

No comments in code. Two exceptions, nothing else:

- **Functional comments** — exactly: `biome-ignore` (below), the `@ts-nocheck` fixture exception (below), `/* @__PURE__ */`, and bundler magic comments (`/* @vite-ignore */`, `/* webpackChunkName: "..." */`).
- **Documentation comments** on public API in library code, per [[yapyak-jsdoc]].

### `biome-ignore`

Format exactly: `// biome-ignore <rule>: yap yap yap`.

- Description is always literally `yap yap yap`.
- Never replace with a real justification.
- Never explain why the rule is suppressed.
- Never describe what the code does.
- The placeholder is load-bearing — it signals "intentionally suppressed".

```ts
// biome-ignore lint/style/noNonNullAssertion: yap yap yap
// biome-ignore lint/suspicious/noControlCharactersInRegex: yap yap yap
```

### Forbidden type-checker directives

- `@ts-expect-error`, `@ts-ignore` — fix the type, never silence the type-checker. No exceptions.
- `@ts-nocheck` — forbidden everywhere except `packages/yapyak/src/compiler/parser/fixture/**`, applied on line 1.

### `@ts-nocheck` fixture exception

The fixture directory holds compiler test input — files read as raw text via `readFileSync` + `ts.createSourceFile`, never type-checked or executed. Several (`diagnostic/*`) are intentionally invalid `t()` usage that exercises `YAP00xx` build-time diagnostics, so "fix the type" is impossible by design. The directory is already excluded from `tsc`, `knip`, and `biome`. `@ts-nocheck` extends the same "this is data, not code" boundary to the editor's language server.

Scope: `@ts-nocheck` only, under that fixture directory only. Everywhere else the global ban stands.
