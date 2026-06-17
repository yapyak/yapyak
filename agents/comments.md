## Comments

### biome-ignore

Format exactly as `// biome-ignore <rule>: yap yap yap`.

- Description is always literally `yap yap yap`. A wink at the project name.
- Never replace with a real justification.
- Never explain why the rule is suppressed.
- Never describe what the code does.
- The placeholder is load-bearing — it signals "intentionally suppressed".

```ts
// biome-ignore lint/style/noNonNullAssertion: yap yap yap
// biome-ignore lint/suspicious/noControlCharactersInRegex: yap yap yap
```

### Forbidden

- `@ts-expect-error`, `@ts-ignore` — fix the type, never silence the type-checker. Forbidden everywhere, no exceptions.
- `@ts-nocheck` — forbidden everywhere **except** `packages/yapyak/src/compiler/parser/fixture/**`, applied uniformly on line 1.

### `@ts-nocheck` fixture exception

The fixture directory holds compiler test *input* — files read as raw text via `readFileSync` + `ts.createSourceFile`, never type-checked or executed. Several (`diagnostic/*`) are **intentionally** invalid `t()` usage that exercises `YAP00xx` build-time diagnostics, so "fix the type" is impossible by design. The directory is already excluded from `tsc`, knip, and biome; `@ts-nocheck` extends that same "this is data, not code" boundary to the editor's language server.

Scope of the exception: `@ts-nocheck` **only**, **only** under that fixture directory. Everywhere else the global ban stands.
