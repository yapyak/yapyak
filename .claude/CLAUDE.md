# CLAUDE.md

## Project

`yapyak` is a Vite-first i18n library. The published package is `yapyak` (unscoped). Internal workspace packages live under `@yapyak/*` (`@yapyak/biome-config`, `@yapyak/typescript-config`, `@yapyak/docs`). The runtime translation function is `t()`.

Monorepo layout:
- `packages/yapyak/` — the published library (runtime, vite plugin, CLI, adapters, translators, persistence)
- `packages/biome-config/` — shared biome config, private
- `packages/typescript-config/` — shared tsconfig, private
- `docs/` — Vite + TanStack Start docs site, private
- `examples/{react,svelte,vue}/` — minimal framework demos

## Core principle

**Consistency beats local optimization.** If there are two reasonable ways to do something, one is forbidden. The closed vocabularies below (type suffixes, verb prefixes, boolean prefixes) exist for this reason — **extend the list first, then code**. Never coin a new name at the call site.

Names describe **what**, not **how**. Execution details (`*Sync`, `*FromCookie`, `*ViaGraphQL`) leak implementation into the API. If two implementations must be distinguished, separate them at the module level — never as a suffix on every name.

Breaking changes are acceptable. Inconsistency is not.

---

## Naming

### Files and folders

- All files and folders use kebab-case. No exceptions.
- Filename matches primary export by spelling, not casing: `createIntl` → `create-intl.tsx`, `useLocale` → `use-locale.ts`.
- When only one of a kind exists in a module, drop qualifiers. The parent module provides context: `vite/parser.ts`, not `vite/vite-parser.ts`.

### Singular vs plural

**Singular:** file names, type names, concept folders, single-value variables.
**Plural:** collection variables (arrays/sets/maps), dictionary folders that hold peer items.

```ts
// ✓
const locale = 'sv';                    // single value
const locales = ['en', 'sv'];           // collection
cookie.ts, locale.ts, endpoint.ts       // singular files
adapter/, locale/, runtime/             // concept folders
cli/commands/, utils/                   // peer-item dictionary folders

// ✗
cookies.ts, locales.ts                  // plural files
```

The folder test: **is this a concept or a collection of peers?** A new item in a peer dictionary slots in next to existing ones without ranking → plural. A folder that names a single concept → singular.

### Type suffix vocabulary

Closed list. Extend before coining.

| Suffix | Meaning | Example |
|---|---|---|
| `*Options` | Configuration passed to a function or factory | `CreateClientOptions` |
| `*Config` | Static configuration loaded from disk | `YapyakCliConfig` |
| `*Result` | Return value of a non-trivial computation | `CollectResult` |
| `*Entry` | A single key-value pair in a collection or map | `CacheEntry`, `RenameEntry` |
| `*Item` | A single element in an ordered sequence | `TranslateItem` |
| `*Context` | Bundle of state passed through a flow | `OperationContext`, `MessageContext` |
| `*Tree` | Nested or recursive data structure | `OperationTree`, `EndpointTree` |
| `*Stats` | Aggregated metrics | `LocaleStats` |
| `*Data` | Raw data bundle (vs aggregated `*Stats`) | `LocaleData` |
| `*Dict` | Record-shaped value with arbitrary keys | `ParamDict`, `Dict` |
| `*Position` | Location in source/file | `MessagePosition` |
| `*Site` | Location enriched with context | `CallSite` |
| `*Range` | Span or extent | `ArgsRange` |
| `*Pattern` | Matcher (regex-like) | `FilterPattern` |
| `*Level` | Ordinal/enum classification | `ContextLevel` |
| `*Request` | Input data for an operation | `TranslateBatchRequest` |
| `*Error` | Custom error class | `DomainError` |
| `*Base` | Abstract parent class (rare in TS) | — |
| `*Props` | React component props | `IntlProviderProps` |
| `*Return` | Hook return type | `UseLocaleReturn` |
| `*Tag` / `*Kind` | Discriminator string for union types | — |

**Past-participle prefix pattern.** A type representing the post-processed form of a base type uses the participle as a prefix when the distinction is meaningful:

```ts
WalkedFile         // file after walk (with metadata)
ExtractedMessage   // message after extraction
NormalizedOptions  // options after normalization
```

### Function-name prefix on function-scoped types (deterministic rule)

For the four function-scoped suffixes — `*Options`, `*Config`, `*Result`, `*Request` — the prefix is decided by a mechanical consumer count:

- **Exactly 1 function consumes it** → prefix with that function's **full name** in PascalCase.
- **2+ functions consume it** → it's a shared concept. No function prefix — use the concept name.

```ts
// ✓ Single consumer — full function name
function resolveLocale(options: ResolveLocaleOptions) { ... }
function syncLocaleFiles(options: SyncLocaleFilesOptions) { ... }
function createClient(c, b, options: CreateClientOptions) { ... }

// ✓ Shared concept — no function prefix
const cache: Cache = ...                  // used by many
const params: ParamDict<T> = ...          // used by t() AND user wrappers
```

For domain suffixes (`*Entry`, `*Item`, `*Context`, `*Tree`, `*Dict`, `*Position`, `*Site`, `*Range`, `*Pattern`, `*Level`, `*Stats`, `*Data`), the prefix is always the **concept noun** — never a function name. These types are *things*, not function-input bundles.

### Function verb prefix vocabulary

Closed list. Every function starts with one of these.

| Prefix | Purpose | Example |
|---|---|---|
| `get*` | Pure getter — no side effects, no async | `getLocale()` |
| `set*` | Mutator — updates state, may notify | `setLocale(locale)` |
| `has*` | Boolean check — "does this have X?" | `hasPlaceholder()` |
| `is*` / `are*` | Boolean state — "is/are this(these) X?" | `isPlainObject()`, `areMessagesEqual(a, b)` |
| `find*` | Search — returns first match or `null`/`undefined` | `findCallSites()` |
| `format*` | Format a value to a string (Intl-style) | `formatDate()` |
| `to*` | Convert a value into another shape | `toDate()`, `toPositionKey()` |
| `use*` | React hook | `useLocale()` |
| `parse*` | String → structured value | `parseCookie()` |
| `resolve*` | Compute final value from inputs | `resolveLocale()` |
| `extract*` | Pull a subset out of larger data | `extractMessages()` |
| `transform*` | Map A → B preserving structure | `transformSource()` |
| `normalize*` | Bring to canonical form | `normalizeOptions()` |
| `generate*` | Produce derived output (codegen) | `generateConfig()` |
| `discover*` | Scan filesystem/source for a set of items | `discoverLocales()` |
| `migrate*` | Refactor existing data in place | `migrateLocales()` |
| `render*` | Produce display output (table, token, UI) | `renderTable()` |
| `validate*` | Run validation — return result, may throw | `validateBatch()` |
| `load*` | Async load from disk or network | `loadEnv()` |
| `read*` / `write*` | I/O operations | `readLocaleData()` |
| `create*` | Public factory | `createClient()` |
| `make*` | Private file-scope factory | `makeT()` |
| `define*` | DSL definer for static config | `defineEndpoint()` |
| `with*` | Run a callback inside an async scope | `withRequest()` |
| `register*` | Add to an internal registry | `registerTracker()` |
| `subscribe*` | Observer pattern, returns unsubscribe | `subscribeLocale()` |
| `run*` | Execute registered side effects | `runTrackers()` |
| `pick*` / `omit*` | Subset operations | `pick()` |
| `walk*` | Recursive traversal | `walkSourceFiles()` |
| `build*` | Construct a complex object | `buildOperationTree()` |

### Generics

- **One type parameter:** use `T`.
- **Two or more type parameters:** prefix each with `T` and use a descriptive, unabbreviated name — `TKey`, `TValue`, `TSource`, `TAccumulator`.
- Never abbreviate (`Acc`, `Src`, `K`, `V`).

```ts
// ✓
type ParamDict<T extends string> = ...
type ExtractParamDict<TSource extends string, TAccumulator = unknown> = ...

// ✗
type ExtractParamDict<S extends string, Acc = unknown> = ...
type Record<Key extends string, Value> = ...    // multi-generic without T-prefix
```

The prefix makes type parameters visually unambiguous against concrete types (`TElement` vs `Element`, `TKey` vs a domain `Key`).

### Boolean naming

All `boolean`-typed variables, properties, and functions that return `boolean` **must** carry one of these prefixes:

| Prefix | Meaning | Example |
|---|---|---|
| `is*` | State / classification | `isLoading`, `isPlainObject` |
| `has*` | Possession / presence | `hasError`, `hasPlaceholder` |
| `can*` | Ability / permission | `canEdit` |
| `should*` | Recommendation / decision | `shouldPreserveTranslations` |
| `will*` | Future state | `willClose` |
| `was*` | Past state | `wasFetched` |
| `are*` | Plural state | `areMessagesEqual` |

**Exceptions** (no prefix required) — only these three:

- **React component props.** Follow HTML attribute conventions: `<Button disabled />` not `<Button isDisabled />`.
- **Hook parameters that mirror props.** `useDisclosure({ open, defaultOpen })`. The hook's *internal* state still uses the prefix: `const [isOpen, setIsOpen] = useState(open)`.
- **CLI flag mirrors.** `--json` → `options.json`, `--force` → `options.force`.

Everything else — internal config, plugin options, schema fields, function returns, intermediate variables — follows the prefix rule.

### Map and Set naming

**Set** — always a plural noun describing the elements: `listeners`, `trackers`, `seen`, `aliases`.

**Map** — pick by purpose:

| Purpose | Pattern | Example |
|---|---|---|
| Index/lookup (key derived from value) | `<plural-values>By<KeyName>` | `messagesByFile`, `usersById` |
| Cache/memoization (input → derived) | `<thing>Cache` (suffix) | `pluralRulesCache` |
| Domain mapping (the map *is* a concept) | Plural noun for contents | `branches`, `variants` |

**Forbidden** — bare type-nouns or generic names. If you can't name the contents, the variable is at the wrong level:

```ts
const set = new Set();       // ✗
const map = new Map();       // ✗
const data = {};             // ✗
const result = new Map();    // ✗
```

---

## Code structure

### Modules

- **Named exports only.** Never `export default`.
- One concept per file.
- `index.ts` re-exports the public API of a folder/module.

### Cross-module imports

Within `src/`, every folder is its own module. Cross-module imports **always** go through `B/index.ts` — never directly to a sub-file. Intra-module imports (same folder) stay direct.

```ts
// ✓ Right
import { getLocale, setLocale } from '../locale/index.ts';     // cross-module via barrel
import type { Persistence } from './index.ts';                  // intra-module direct

// ✗ Wrong
import { getLocale } from '../locale/store.ts';                 // reaches past the barrel
```

The rule lets each module refactor freely. A symbol only appears in `index.ts` if another module needs it.

### Visibility — public, semi-public, private

| Level | Where it lives | Marker | Reachable by |
|---|---|---|---|
| **Public** | In a module barrel **and** a package entry point in `package.json` `exports` | None | Users of the package |
| **Semi-public** | In a module barrel for cross-module use within the package | `/** @internal */` on the **definition** | Other modules in the package, via the barrel |
| **Private** | Not exported from any barrel | None | Same-folder files only |

The `@internal` marker:
- Goes on the **definition site** (the `export function`, `export interface`), never on the re-export line in the barrel.
- Companion: `stripInternal: true` in `@yapyak/typescript-config/library` removes `@internal` from emitted `.d.ts` so users can't import them; runtime `.js` stays intact.
- Format: single line `/** @internal */` immediately above the export. No extra JSDoc body on internal symbols.

Decision flow for a new export:

1. Will another module need it? **No** → don't put it in the barrel. No marker.
2. **Yes** → put it in the barrel.
   - Should users use it? **No** → mark `@internal` at definition.
   - **Yes** → no marker. Wire into the relevant package entry point.

### Test files

- Unit tests: `*.test.ts` co-located next to implementation.
- Type-only tests (`expectType<T>`): `*.test-d.ts`.
- One test file per implementation file. Never a `tests/` folder.

---

## Language rules

### TypeScript

- All library packages extend `@yapyak/typescript-config/library`.
- `isolatedDeclarations: true` — every exported function/component needs an explicit return type.
- Never use the `readonly` modifier.
- Never use `as unknown as` to make code compile. Fix the type instead.

### Return types — no `T | null` for "no work done"

A function that processes input and returns a typed result **always returns that type**. Never use `T | null` where `null` signals "no transformation needed" / "no-op" — that's a double contract.

For "did anything happen?" use a flag in the result type or a discriminated union.

```ts
// ✗ Wrong
function transformSource(code, options): TransformResult | null { ... }

// ✓ Right — always returns the result, flag tells you if it changed
interface TransformResult {
  changed: boolean;
  code: string;
}
function transformSource(code, options): TransformResult { ... }

// ✓ Also right — discriminated union
type TransformResult =
  | { changed: false }
  | { changed: true; code: string };
```

`T | null` is reserved for genuine **not-found lookups** (`findEntry`, `pickTranslator`, `parseDate`) and **input-driven absences** (`createPersistence(null)` returns `null` because the config said so). Never for "I had nothing to do".

### Null/undefined checks

Default to explicit comparison. Truthy checks (`!value`) are a footgun in typed code — they conflate `undefined`/`null` with `0`/`''`/`false`, and TS's narrowing relies on the explicit form.

| Type | Check |
|---|---|
| `T \| undefined` | `value === undefined` / `value !== undefined` |
| `T \| null` | `value === null` / `value !== null` |
| `T \| null \| undefined` | `value == null` / `value != null` (double-equal, catches both) |
| `boolean` | `value` / `!value` (it *is* a boolean) |
| Explicit boolean coercion (rare) | `Boolean(value)` — not `!!value` |

```ts
// ✓
if (locale === undefined) return DEFAULT;
if (value == null) return;          // T | null | undefined

// ✗
if (!count) return;                 // count: number | undefined — treats 0 as missing
if (!!value) { ... }                // use Boolean(value)
```

Truthy checks are allowed **only** when all falsy values (`null`, `undefined`, `0`, `''`, `false`) genuinely should be treated the same.

### Control flow

- Always use braces and a newline. No one-line `if`-statements.

### Object literals

- One property per line. Exceptions: well-known patterns like `{ sync: true }`, `{ timeout: 3000 }`.

### Comments

**Never write comments in code.** No `//`, no `/* */`, no explanatory prose, no TODOs, no section dividers, no "why" notes. Code communicates through naming and structure — if a comment feels necessary, the code is wrong.

**Only two exceptions:**

1. **JSDoc on public API symbols** — types, functions, and constants exported as public API get a JSDoc block (description, `@example`, `@param`, `@returns`). Internal symbols (`@internal`-marked or private) never get JSDoc beyond the `/** @internal */` tag itself.
2. **`biome-ignore` suppressions** — formatted exactly as `// biome-ignore <rule>: yap yap yap`. See *Lint suppressions*.

No other comments exist. Ever.

---

## React

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

---

## Tooling

### Lint suppressions

Every `biome-ignore` description is **always** `yap yap yap`. No exceptions — it's the project convention.

```ts
// biome-ignore lint/style/noNonNullAssertion: yap yap yap
// biome-ignore lint/suspicious/noControlCharactersInRegex: yap yap yap
```

Do not write a "real" justification. The suppression itself is the signal that the author considered it; the description is branding.

### Build

- `packages/yapyak/` builds with `tsc -p tsconfig.build.json` to `dist/`. `package.json` `exports` point to `./dist/**`.
- TS config uses `rewriteRelativeImportExtensions: true` so source imports use `.ts` extensions and the emit rewrites them to `.js`.

### Vite-plugin compile target

`yapyak/internal` is a public subpath that **only** exists for the Vite plugin's emitted code (transformed `t()` calls). Users should never import from it manually. The single export (`pick`) is the runtime side of the compiler — calling it directly bypasses placeholder type-checking the plugin enforces at compile time.

### Versioning

**Hard rules — no exceptions.**

- **Never** use `^` or `~` in version specifiers anywhere. All versions are exact.
- **All external dependencies** in `dependencies`/`devDependencies` use `catalog:` — never inline version strings. Versions live exactly once in `pnpm-workspace.yaml` under `catalog:`.
- **Internal workspace packages** use `workspace:*`.
- **peerDependencies** use `>=X`-ranges (library minimum-version contract — these are not installed by pnpm).
- **`engines`** uses `>=X`.

```jsonc
// ✓ Right
{
  "dependencies": {
    "vite": "catalog:",
    "@yapyak/typescript-config": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=19"
  },
  "engines": {
    "node": ">=22"
  }
}

// ✗ Wrong
{
  "dependencies": {
    "vite": "^8.0.0",        // caret forbidden
    "react": "19.0.0"        // inline forbidden — use catalog:
  }
}
```

Adding a new external dep: pin the exact version in `pnpm-workspace.yaml` under `catalog:` first, then reference with `"catalog:"` in the consuming `package.json`.

### Formatting

Always run `pnpm check:write` after changes.
