# CLAUDE.md

## Project

`yapyak` is a Vite-first i18n library. The main package is published as `yapyak` (unscoped). Internal/private workspace packages live under the `@yapyak/*` scope (`@yapyak/biome-config`, `@yapyak/typescript-config`, `@yapyak/docs`). The runtime translation function is `t()`.

Monorepo layout:
- `packages/yapyak/` — the published library (core runtime, vite plugin, CLI, adapters, translators, persistence)
- `packages/biome-config/` — shared biome config (`@yapyak/biome-config`, private)
- `packages/typescript-config/` — shared tsconfig (`@yapyak/typescript-config`, private)
- `docs/` — VitePress-free docs site built with Vite + TanStack Start (`@yapyak/docs`, private)
- `examples/{react,svelte,vue}/` — minimal framework demos

## Conventions (strict)

### File naming

- All files and folders use kebab-case. No exceptions.
- Filename matches primary export by spelling, not casing: `createIntl` → `create-intl.tsx`, `useLocale` → `use-locale.ts`.

### Modules

- **Named exports only.** Never `export default`.
- One concept per file.
- `index.ts` re-exports the public API of a package.

### Cross-module imports

Within `src/`, every folder is its own module (`adapter/`, `locale/`, `persistence/`, `runtime/`, `translator/`, `vite/`, etc.). When a file in module A needs something from module B, the import **always** goes through `B/index.ts` — never directly to a sub-file.

```ts
// ✓ Right — cross-module imports go through the barrel
import { getLocale, setLocale } from '../locale/index.ts';
import { parseCookie } from '../persistence/index.ts';
import { extractMessages } from '../vite/index.ts';

// ✗ Wrong — reaching into another module's internals
import { getLocale } from '../locale/store.ts';
import { parseCookie } from '../persistence/cookie.ts';
import { extractMessages } from '../vite/extract-messages.ts';
```

Intra-module imports (files within the same folder importing each other) **stay direct** — no barrel hop:

```ts
// ✓ Right — same folder, direct import
// in persistence/cookie.ts
import type { Persistence } from './index.ts';
```

The rule lets each module refactor its internal structure freely. Adding, renaming, or splitting files inside a module never breaks consumers as long as `index.ts` stays stable.

A symbol only appears in `index.ts` if another module needs it. Internal helpers stay unexported from the barrel.

### TypeScript

- All library packages extend `@yapyak/typescript-config/library`.
- `isolatedDeclarations: true` — every exported function and component must have an explicit return type.
- Never use the `readonly` modifier.
- Never use `as unknown as` to make code compile. Fix the type instead.

### Generics

- **One type parameter:** use `T`.
- **Two or more type parameters:** prefix each with `T` and use a descriptive, unabbreviated name — `TKey`, `TValue`, `TSource`, `TAccumulator`, `TName`, `TFormat`.
- Never abbreviate (`Acc`, `Src`, `K`, `V`). Single-letter `T` is allowed only for the one-generic case.
- The prefix makes type parameters visually unambiguous against concrete types (`TElement` vs `Element`, `TKey` vs a domain `Key`).

```ts
// ✓ One generic — T
type ParamDict<T extends string> = ...
function useState<T>(initial: T): [T, (next: T) => void]

// ✓ Two+ generics — T-prefix, full word
type Record<TKey extends string, TValue> = ...
type ExtractParamDict<TSource extends string, TAccumulator = unknown> = ...

// ✗ Abbreviated
type ExtractParamDict<S extends string, Acc = unknown> = ...

// ✗ Mixed (no prefix on multi-param)
type Record<Key extends string, Value> = ...
```

### React

- Props type is an exported interface in the same file: `export interface ProviderProps`.
- Props are destructured on the first line of the function body, not in the signature.
- Defaults are set in destructuring assignment.
- `...restProps` is spread onto the root element when wrapping a native or base element.

### Hooks

- One hook per file: `use-locale.ts`.
- Options/return types named `Use[Name]Options` / `Use[Name]Return`.

### Refs

- DOM root ref always named `element`.
- Other refs suffix `Ref`: `timerRef`, `onChangeRef`.
- `$`-prefix reserved for ref extractions: `const $element = element.current`.
- Always call `setTimeout`/`setInterval`/`clearTimeout`/`clearInterval`/`requestAnimationFrame` on `window`.
- Timeout/interval refs typed `useRef<number>(undefined)` — never `useRef<ReturnType<typeof setTimeout>>`.

### Control flow

- Always use braces and a newline. No one-line `if`-statements.

### Object literals

- One property per line. Exceptions: well-known patterns like `{ sync: true }`, `{ timeout: 3000 }`.

### Comments

- Default to no comments. Add only when the WHY is non-obvious and the code itself cannot communicate it.
- No multi-line comments, no JSDoc on internal symbols.

### Visibility — public, semi-public, private

Every exported symbol falls into one of three visibility levels:

| Level | Where it lives | Marker | Reachable by |
|---|---|---|---|
| **Public** | In a module barrel `index.ts` *and* a package entry point in `package.json` `exports` | None | Users of the package |
| **Semi-public** | In a module barrel `index.ts` for cross-module use within the package | `/** @internal */` on the **definition** | Other modules within the package, via the barrel |
| **Private** | Not exported from any barrel — lives in a sub-file of its own module | None needed | Only files in the same folder |

The `@internal` marker:
- Goes on the **definition site** (the `export function`, `export interface`, etc.), never on the re-export line in the barrel.
- Companion compiler setting: `stripInternal: true` (set in `@yapyak/typescript-config/library`). With it, `@internal` declarations are removed from emitted `.d.ts` files, so TypeScript users can't accidentally `import { x } from 'yapyak/...'`. The `.js` output stays intact, so cross-module imports inside the package continue to work at runtime.
- Format: single line, immediately above the export.

```ts
// ✓ Correct — @internal at definition
/** @internal */
export function registerTracker(fn: () => void): () => void { ... }
```

```ts
// ✗ Wrong — @internal on the re-export in a barrel
// runtime/index.ts
/** @internal */
export { registerTracker } from './tracker.ts';
```

```ts
// ✗ Wrong — @internal on something that doesn't need barrel export
// vite/find-call-sites.ts (used only within vite/)
/** @internal */
export function findCallSites(code: string): CallSite[] { ... }
// — if no other module imports this, the barrel shouldn't expose it,
//   and the marker is redundant
```

Decision flow when writing a new export:

1. Will another module need it? **No** → don't put it in the barrel. No marker.
2. Will another module need it? **Yes** → put it in the barrel.
   - Should users be able to use it? **No** → mark `@internal` at definition.
   - **Yes** → no marker. Make sure the symbol is also wired into the relevant package entry point.

### Lint suppressions

Every `biome-ignore` description is **always** `yap yap yap`. No exceptions. It's the project convention — a wink at the name.

```ts
// biome-ignore lint/style/noNonNullAssertion: yap yap yap
// biome-ignore lint/suspicious/noControlCharactersInRegex: yap yap yap
// biome-ignore lint/suspicious/noDocumentCookie: yap yap yap
```

Do not write a "real" justification. Do not explain why the rule doesn't apply. The suppression itself is the signal that the author already considered it; the description is branding.

### Build

- `packages/yapyak/` is built with `tsc -p tsconfig.build.json` to `dist/`. `package.json` `exports` point to `./dist/**`.
- The TS config uses `rewriteRelativeImportExtensions: true` so source imports use `.ts` extensions and the emit rewrites them to `.js`.
- `isolatedDeclarations: true` is enforced — every exported function/component needs an explicit return type.

### Vite-plugin compile target

`yapyak/internal` is a public subpath that **only** exists for the Vite plugin's emitted code (transformed `t()` calls). Users should never import from it manually. The single export (`pick`) is the runtime side of the compiler — calling it directly bypasses placeholder type-checking that the plugin enforces at compile time.

### Versioning

- Use `workspace:*` for internal package references.
- Use `catalog:` for shared external dependencies (defined in `pnpm-workspace.yaml`).

### Formatting

- Always run `pnpm check:write` after changes.
