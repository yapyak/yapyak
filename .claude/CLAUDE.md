# CLAUDE.md

## Project

`yapyak` is a Vite-first i18n library. The main package is published as `yapyak` (unscoped). Internal/private workspace packages live under the `@yapyak/*` scope (`@yapyak/biome-config`, `@yapyak/typescript-config`, `@yapyak/docs`). The runtime translation function is `t()`.

Monorepo layout:
- `packages/yapyak/` — the published library (core runtime, vite plugin, CLI, adapters, translators, persistence)
- `packages/biome-config/` — shared biome config (`@yapyak/biome-config`, private)
- `packages/typescript-config/` — shared tsconfig (`@yapyak/typescript-config`, private)
- `docs/` — VitePress-free docs site built with Vite + TanStack Start (`@yapyak/docs`, private)
- `examples/{react,svelte,vue}/` — minimal framework demos

## Core principle

**Consistency beats local optimization.**

If there are two reasonable ways to do something, one is forbidden. If something looks cleaner in isolation but introduces variation, it is not allowed. The closed vocabularies below (type suffixes, verb prefixes) exist for this reason — extend the list first, then code. Never coin a new name at the call site.

Breaking changes are acceptable. Inconsistency is not.

Names describe **what**, not **how**. Execution details (`*Sync`, `*FromCookie`, `*ViaGraphQL`) leak implementation into the API. If two implementations must be distinguished, separate them at the module level — never as a suffix on every name.

## Conventions (strict)

### File naming

- All files and folders use kebab-case. No exceptions.
- Filename matches primary export by spelling, not casing: `createIntl` → `create-intl.tsx`, `useLocale` → `use-locale.ts`.

### Singular vs plural

**Always singular:**
- File names: `cookie.ts`, `locale.ts`, `endpoint.ts`, `pick.ts` — never `cookies.ts`
- Type names: `Endpoint`, `Locale`, `Cookie` — never `Endpoints`
- Concept folders: `adapter/`, `locale/`, `runtime/`, `translator/` — the folder names a concept
- Single-value variables: `const locale = 'sv'`, `const user = { ... }`

**Plural:**
- Collection variables (arrays, sets, maps): `const locales = ['en', 'sv']`, `const users = [...]`
- Dictionary folders that hold a flat collection of peer items: `cli/commands/`, `utils/`

The test for folders: **is this a concept or a collection of peers?** A new item in a dictionary folder slots in next to existing ones without ranking — that's plural. A folder that names a single concept (even if it has many files implementing it) is singular.

### Singleton naming — skip the qualifier

When there's only one of a kind within a module, drop the qualifier. The parent module provides context.

```ts
// ✓ Right — only one parser in vite/
vite/parser.ts

// ✗ Wrong — unnecessary qualifier
vite/vite-parser.ts
vite/source-parser.ts
```

Add qualifiers only when distinguishing between multiple peers.

### Test files

- Unit tests: `*.test.ts` co-located next to implementation
  - `store.ts` → `store.test.ts`
- Type-only tests (no runtime, `expectType<T>`): `*.test-d.ts`
- One test file per implementation file. Never a `tests/` folder.

### Type suffix vocabulary

Closed vocabulary for type names. Pick from this list — never invent a new suffix at the call site.

| Suffix | Meaning | Example |
|---|---|---|
| `*Options` | Configuration passed to a function or factory | `CreateClientOptions`, `ResolveOptions` |
| `*Result` | Return value of a non-trivial computation | `CollectResult` |
| `*Entry` | A single item in a collection or map | `MissingEntry`, `CacheEntry` |
| `*Context` | Bundle of state passed through a flow | `OperationContext`, `MessageContext` |
| `*Tree` | Nested or recursive data structure | `OperationTree`, `EndpointTree` |
| `*Stats` | Aggregated metrics | `LocaleStats` |
| `*Error` | Custom error class | `DomainError`, `ConstraintError` |
| `*Base` | Abstract parent class (rare in TS) | — |
| `*Dict` | Record-shaped value | `ParamDict`, `Dict` |
| `*Props` | React component props | `IntlProviderProps` |
| `*Return` | Hook return type | `UseLocaleReturn` |
| `*Tag` / `*Kind` | Discriminator string for union types | — |

If a new shape doesn't fit any entry above, **extend this list first, then code**.

### Function verb prefix vocabulary

Closed vocabulary for the first word of function names. Same rule: extend the list before inventing.

| Prefix | Purpose | Example |
|---|---|---|
| `get*` | Pure getter — no side effects, no async | `getLocale()` |
| `set*` | Mutator — updates state, may notify | `setLocale(locale)` |
| `has*` | Boolean check — "does this have X?" | `hasPlaceholder(template)` |
| `is*` | Boolean state — "is this X?" | `isPlainObject(value)` |
| `load*` | Async load from disk or network | `loadEnv()`, `loadConfig()` |
| `read*` / `write*` | I/O operations | `readLocaleData()`, `writeFile()` |
| `parse*` | String → structured value | `parseCookie()`, `parseAcceptLanguage()` |
| `resolve*` | Compute final value from inputs | `resolveLocale()`, `resolveKeyTransform()` |
| `extract*` | Pull a subset out of larger data | `extractMessages()`, `extractParams()` |
| `transform*` | Map A → B preserving structure | `transformKeys()`, `transformSource()` |
| `create*` | Public factory | `createClient()`, `createOperation()` |
| `make*` | Private file-scope factory | `makeT()`, `makeEmptyResult()` |
| `define*` | DSL definer for static config | `defineEndpoint()`, `defineContract()` |
| `with*` | Run a callback inside an async scope | `withRequest()`, `withLocale()` |
| `register*` | Add to an internal registry | `registerTracker()` |
| `subscribe*` | Observer pattern, returns unsubscribe | `subscribeLocale()` |
| `run*` | Execute registered side effects | `runTrackers()` |
| `pick*` / `omit*` | Subset operations | `pick()` |
| `walk*` | Recursive traversal | `walkSourceFiles()` |
| `build*` | Construct a complex object | `buildOperationTree()` |
| `normalize*` | Bring to canonical form | `normalizeOptions()`, `normalizeKey()` |

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
