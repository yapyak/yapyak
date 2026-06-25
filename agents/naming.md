## Naming

### Files and folders

- All files and folders use `kebab-case`. No exceptions.
- Filename matches primary export by spelling, not casing: `createIntl` → `create-intl.tsx`, `useLocale` → `use-locale.ts`.
- When only one of a kind exists in a module, drop qualifiers. The parent module provides context: `vite/parser.ts`, not `vite/vite-parser.ts`.

#### Mechanical filename derivation

Filename is derived from the primary export through a deterministic algorithm. Two reviewers running it on the same input get the same output. **There is no closed list of verbs to maintain.**

The algorithm strips the leading verb unconditionally, then strips natural-English prepositions and modifiers from small closed lists, then singularizes the trailing noun. The remaining segments are the filename.

```
ALGORITHM:
  1. Kebab-case the primary export name.
  2. Drop the FIRST segment (the verb — always, no list lookup).
  3. While first remaining segment is in PREPOSITION list, drop it.
  4. While first remaining segment is in MODIFIER list, drop it.
  5. Singularize the trailing segment.
  6. If parent-folder name equals any remaining segment, drop it.
  7. If filename is now empty (everything stripped), fall back to the verb
     dropped in step 2.
```

**The only closed lists** — all stable English vocabulary, not domain-specific:

```
PREPOSITION (10):
  with, from, to, in, for, of, by, into, onto, at, on

MODIFIER (~25, by category):
  Quantifiers:  all, any, every, none, no
  Positions:    first, last, next, prev, previous, current, latest, oldest
  Relations:    adjacent, parent, child, sibling, root, leaf, top, bottom
  Selectors:    default, primary, secondary, tertiary
  Auto-prefix:  auto

IRREGULAR PLURALS (8):
  children, people, men, women, mice, feet, teeth, geese

HOST-INTEGRATION FILENAMES (4) — see exception below:
  plugin, middleware, handle, integration
```

Modifiers describe **position/quantity/relation** of the noun. They are NOT subtypes. `internal` (subtype) is kept; `first` (position) is dropped. `code` (subtype) is kept; `all` (quantifier) is dropped.

**Singularize rules:**

- Trailing `s` → drop (`pages` → `page`)
- Trailing `ies` → `y` (`entries` → `entry`)
- Trailing `es` after sibilants (`sh`, `ch`, `x`, `z`, `ss`) → drop `es` (`boxes` → `box`)
- Irregulars per the closed list

**Worked examples:**

| Export | Trace | Filename |
| --- | --- | --- |
| `getSidebar` | drop `get` → Sidebar | `sidebar.ts` |
| `getPage` | drop `get` → Page | `page.ts` |
| `getFirstPage` | drop `get` → FirstPage → drop `first` → Page | `page.ts` |
| `getAllPages` | drop `get` → AllPages → drop `all` → Pages → singular Page | `page.ts` |
| `findAdjacentPages` | drop `find` → AdjacentPages → drop `adjacent` → Pages → Page | `page.ts` |
| `getInternalLinks` | drop `get` → InternalLinks (`internal` not in MODIFIER) → InternalLink | `internal-link.ts` |
| `getCodeBlocks` | drop `get` → CodeBlocks (`code` not in MODIFIER) → CodeBlock | `code-block.ts` |
| `parseArguments` | drop `parse` → Arguments → Argument | `argument.ts` |
| `walkBlocks` | drop `walk` → Blocks → Block | `block.ts` |
| `isBlock` | drop `is` → Block | `block.ts` (merges with walkBlocks) |
| `walkSourceFiles` | drop `walk` → SourceFiles → SourceFile | `source-file.ts` |
| `findMatchingBrace` | drop `find` → MatchingBrace (`matching` not in MODIFIER) → MatchingBrace | `matching-brace.ts` |
| `wrapWithProgress` | drop `wrap` → WithProgress → drop `with` (PREPOSITION) → Progress | `progress.ts` |
| `extractParams` | drop `extract` → Params → Param | `param.ts` |
| `migrateLocales` | drop `migrate` → Locales → Locale | `locale.ts` |
| `autoTranslate` | drop `auto` → Translate | `translate.ts` |
| `syncLocaleFiles` | drop `sync` → LocaleFiles → LocaleFile | `locale-file.ts` |
| `toMessageId` | drop `to` → MessageId | `message-id.ts` |
| `createIntl` | drop `create` → Intl | `intl.tsx` |
| `hasPlaceholder` | drop `has` → Placeholder | `placeholder.ts` |
| `interpolate` | drop `interpolate` → empty → fall back to verb | `interpolate.ts` |
| `pick` | drop `pick` → empty → fall back | `pick.ts` |
| `t` | drop `t` → empty → fall back | `t.ts` |

#### Folder threshold — when to nest

Folders capture multi-file concepts. Threshold is **2**:

```
Create folder X iff 2+ files in the same parent would resolve to the same name.
```

The algorithm naturally drives this — when two files compute to the same name, create a folder named after the shared concept, and the parent-strip step (rule 6) shortens the inner filenames.

**Example — `extractFile` + `transformFile`:**

```
extractFile    → algorithm → file.ts
transformFile  → algorithm → file.ts
                  ↓ COLLISION
Create folder file/:
  parser/file/extract.ts    (extractFile, parent strips File)
  parser/file/transform.ts  (transformFile, parent strips File)
```

**Example — established peer-instance folders:**

```
yapyak/persistence/        3+ peer strategies → folder
  cookie.ts
  local-storage.ts
  url.ts

cli/commands/              10+ peer instances → folder (plural dictionary)
  add.ts
  translate.ts
  ...
```

#### Host-integration exception

These filenames are framework-vocabulary, not derived from exports. The file's identity is "this is the framework's plugin/middleware/handle":

```
plugin.ts        bundler plugin factory (e.g., Vite plugin exporting yapyak())
middleware.ts    router middleware factory (e.g., Express, TanStack)
handle.ts        SvelteKit handle hook
integration.ts   Astro/Nuxt integration factory
```

Filename is the host framework's term, regardless of the export's brand name.

#### Test files mirror source files

A `.test.ts` file's name must match its source file exactly. The test file lives next to the source.

```
✓ argument.ts        ↔  argument.test.ts
✓ extract.ts         ↔  extract.test.ts
✓ canonical.ts       ↔  canonical.test.ts

✗ translate.ts       ↔  auto-translate.test.ts   ← function name leaked into test filename
✗ canonical.ts       ↔  json.test.ts             ← test named after concept it covers, not source
✗ <no source>        ↔  fixtures.test.ts         ← test exists without a source file
```

If a single source file needs multiple test files for **technical** reasons (e.g., separate `vi.mock` configs for vitest module mocks), use `<source>.<variant>.test.ts`:

```
✓ store.ts ↔ store.test.ts ↔ store.url.test.ts   ← variant: URL-persistence-mode mocks
```

This is a narrow exception. If you find yourself reaching for it for non-technical reasons, the source needs splitting instead.

#### `index.ts` is always a barrel

`index.ts` never contains implementation. It exists for one purpose: re-exporting from named files. This is absolute — no exceptions for "small enough" packages or "single export" packages.

```
✓ index.ts re-exports from named files
✗ index.ts has the function/class/const definition inline
```

Every exported symbol lives in a file named by the mechanical algorithm (or the host-integration exception). `index.ts` is the package's public-API description — it states *what* the package exports, not *how* those exports work.

**Example — single-export package:**

```ts
// packages/sveltekit/src/handle.ts
export const handle: Handle = ({ event, resolve }) => ...;

// packages/sveltekit/src/index.ts (barrel)
/**
 * SvelteKit adapter for yapyak.
 * @packageDocumentation
 */
export { handle } from './handle';
```

The 1-line `index.ts` is intentional ceremony. It buys deterministic placement at the cost of one extra line per package.

**Where things go:**

| Lives in | What |
|---|---|
| `index.ts` | `@packageDocumentation` JSDoc, `export {...} from ...` re-exports, and `import './x';` side-effect imports. Nothing else. |
| Named file | Implementation. JSDoc on the export itself. |

**Side-effect imports** (`import './x';`) are allowed in barrels — they're wiring directives, not implementation, and reading them is honest about what happens (the alternative — `export * from './x'` over a file with no exports — is legal but lies to the reader). **Named** (`import { X } from './x'`) and **default** (`import X from './x'`) imports remain forbidden in barrels, because they create local bindings that imply hidden use.

#### React hook exception

React hook files keep the `use-` prefix in the filename, mirroring the exported function name:

```
use-locale.ts    exports useLocale()
use-query.ts     exports useQuery()
```

The `use` prefix is React's required convention for hooks (the React compiler and linter both depend on it). Filename mirrors that convention rather than dropping the verb.

#### Action vs concept — no distinction

Earlier versions of this rule split files into "concept" (verb dropped) and "action" (verb kept). That distinction is gone — the verb is always dropped, because **the concept is always the noun**, and the algorithm always strips toward the noun. A file containing an algorithm (`walkBlocks`) lives in the noun's file (`block.ts`), alongside any other operations on the same noun. Forcing different algorithm-files into the same concept-file creates large files; when that becomes a maintenance concern, refactor to a folder (rule above).

### Singular vs plural

**Folders and files are always singular.** No exceptions.

**Plural is allowed only for collection variables** (arrays/sets/maps), because the variable name describes what it holds, not what the folder is.

```ts
// ✓
const locale = 'sv';                    // single value
const locales = ['en', 'sv'];           // collection variable

cookie.ts, locale.ts, endpoint.ts       // singular files
adapter/, locale/, runtime/             // singular folders (concept)
cli/command/, route/, fixture/          // singular folders (peer instances)

// ✗
cookies.ts, locales.ts                  // never plural files
cli/commands/, routes/, fixtures/       // never plural folders
```

Earlier versions of this rule distinguished "concept folders" (singular) from "peer-instance dictionary folders" (plural like `commands/`, `routes/`). That distinction is **gone** — both kinds are singular now. Glass-clear, no judgment.

The folder name describes the **kind of thing** inside, not how many: `command/` holds command files, `fixture/` holds fixture files. The "many" is implicit in being a folder.

#### Type-only files

Split by **concept**, not by **code kind**. A type isn't a concept — `function`, `const`, and `type` are kinds. Domains like *persistence*, *parser*, *config* are concepts. A persistence type and a persistence encoder belong in the same file; they share a concept.

The mechanical algorithm confirms this — both the type name and the function name strip to the same noun:

```
NormalizedPersistence  → drop "Normalized" → persistence  →  persistence.ts
emitPersistence        → drop "emit"       → persistence  →  persistence.ts
```

Same file. The algorithm is telling you: these belong together.

`type.ts` is only justified when the types **are** the concept — i.e., they form the shared vocabulary of a package or module, and there is no narrower noun that captures all of them:

```ts
// ✓ — compiler/src/parser/type.ts: 22 types that ARE the parser vocabulary
export interface CallSite { ... }
export interface Diagnostic { ... }
export type ProcessorKind = ...;
// ... 19 more

// ✓ — translator/src/type.ts: 7 types that ARE the translator public API
export interface Translator { ... }
export interface TranslateRequest { ... }
// ... 5 more

// ✗ — runtime/src/type.ts holding ONE persistence type
// That type has a concept home (persistence). Use persistence.ts instead.
```

Rule of thumb: if you can name the file after the noun the types share (`persistence`, `binding`, `block`), don't use `type.ts` — use that noun. `type.ts` is the **fallback** when no shared noun exists, not the default.

When you do use `type.ts`, it's always singular. Never `types.ts`.

When a type module has a central type with variants, split into concept files instead:

```ts
// ✓ — block.ts because Block IS the central type
// block/text-block.ts, block/heading-block.ts as variants
export type Block = TextBlock | HeadingBlock | ParagraphBlock | LinkBlock;
```

`types.ts` (plural) is banned. Either rename to `type.ts` or split into concept-named files.

#### Record-shaped types — closed list of role suffixes

`Record<K, V>` types (and nested variants) follow a mechanical two-step rule.

**Step 1 — try role-suffix from the closed list.** If the type's purpose matches exactly one of these roles, use it:

| Suffix | Role | Example |
|---|---|---|
| `*Cache` | Expensive-to-recompute kept around — in-memory memoization OR file-backed regenerable storage. Loss is recoverable. | `OrphanCache`, `pluralRulesCache` |
| `*Snapshot` | Point-in-time view of mutable state | `LocaleSnapshot` |
| `*Catalog` | Authoritative index keyed by domain identifier | `MessageCatalog` |
| `*Registry` | Mutable collection of registered handlers/factories | `TrackerRegistry` |
| `*File` | Shape of a single file's contents | `LocaleFile` |

**Step 2 — if no role matches, use the plural form of the contained thing.**

```ts
// ✓ Role from the list
type OrphanCache = Record<string, Record<string, OrphanEntry>>;       // *Cache — regenerable
type LocaleFile = Record<string, Record<string, CatalogEntry>>;        // *File — one file's shape

// ✓ Plural — no role applies, name follows the contents
type LocaleTranslations = Record<string, string>;                      // these ARE translations
type Variants = Record<string, string | Template>;                     // these ARE variants
type Orphans = Record<string, Record<string, OrphanEntry>>;            // would be the plural form

// ✗ Singular contents-name — neither role nor plural
type Translation = Record<string, string>;                             // reads as "one translation"
type Orphan = Record<string, Record<string, OrphanEntry>>;             // reads as "one orphan"
```

`*Dict` is **banned** — extend the role list before reaching for a generic dictionary suffix. New role-suffixes are added to the table in the same commit as the first type using them.

#### `utils/` and `helpers/` — banned everywhere

```
utils/ , utils.ts, helpers/ , helpers.ts        ✗ never, in library or app code
```

Every utility has a concept. If you can't name the concept, the utility shouldn't be a separate file.

| Situation | Correct response |
| --- | --- |
| 1 utility, 1 consumer | Inline at consumer |
| 1 utility, 2+ consumers | Concept-named file (`pluralize.ts`, `dedupe.ts`, `clamp.ts`) |
| Multiple unrelated utilities | Split into concept files, each in its own home |
| Multiple tightly-related utilities | Merge into concept file (e.g., `string-format.ts` if all do string formatting) |

App code does not get an exception.

### Type suffix vocabulary

Closed list. Extend before coining.

| Suffix | Meaning | Example |
| --- | --- | --- |
| `*Options` | Pure object bundle of fields, no shorthand/union alternatives. Used as input to a function/factory, or as a sub-object inside a `*Config` union. Paired with `options` parameter. | `CreateClientOptions`, `CookieOptions`, `CookiePersistenceOptions` |
| `*Input` | Bundle of inputs to an internal helper. Paired with `input` parameter. | `ApplyOrphanMutationsInput` |
| `*Config` | User configuration. Either (a) a disk-loaded config file shape, or (b) a union with strategy shortcuts (strings/`null`/sub-objects). The user "picks". Paired with `config` parameter. | `YapyakConfig` (disk), `PersistenceConfig` (union), `Config` (when in-context) |
| `*Result` | Return value of a non-trivial action/computation function — coordinated bundle of fields. | `ExtractFileResult`, `LoadYapyakConfigResult` |
| `*Entry` | A single key-value pair in a collection or map | `CacheEntry`, `RenameEntry` |
| `*Item` | A single element in an ordered sequence | `TranslateItem` |
| `*Context` | Bundle of state passed through a flow | `OperationContext`, `MessageContext` |
| `*Tree` | Nested or recursive data structure | `OperationTree`, `EndpointTree` |
| `*Stats` | Aggregated metrics | `LocaleStats` |
| `*Data` | Raw data bundle (vs aggregated `*Stats`) | `LocaleData` |
| `*Position` | Location in source/file | `MessagePosition` |
| `*Site` | Location enriched with context | `CallSite` |
| `*Range` | Span or extent | `ArgsRange` |
| `*Pattern` | Matcher (regex-like) | `FilterPattern` |
| `*Level` | Ordinal/enum classification | `ContextLevel` |
| `*Accessor` | Structural read/write interface to an external surface (platform, host, store) | `SlotAccessor`, `StorageAccessor` |
| `*Request` | Input data for an operation | `TranslateBatchRequest` |
| `*Error` | Custom error class | `DomainError` |
| `*Conflict` | A collision between concurrent or candidate operations | `RenameConflict`, `MergeConflict` |
| `*Base` | Abstract parent class (rare in TS) | — |
| `*Props` | React component props | `IntlProviderProps` |
| `*Return` | Hook return type | `UseLocaleReturn` |
| `*Fn` | Callable / function type | `TFn` |
| `*Params` | A function's parameters type | `TParams` |
| `*Tag` / `*Kind` | Discriminator string for union types | — |

### Suffix selection — mechanical test (deterministic)

Apply top-down. **First match wins.** No two questions can both apply to the same type.

| Step | Question | If yes → suffix |
| --- | --- | --- |
| Q1 | Is the type the exported shape of a disk-loaded config file? | `*Config` |
| Q2 | Is the type a union including shorthand alternatives (strings, primitives, `null`)? | `*Config` |
| Q3 | Does the type match a domain suffix (`*Context`, `*Data`, `*Entry`, `*Item`, `*Stats`, `*Position`, `*Site`, `*Range`, `*Pattern`, `*Level`, `*Tree`, `*Accessor`, `*Conflict`)? | the matching domain suffix |
| Q4 | Is the type a custom error class (extends `Error`)? | `*Error` |
| Q5 | Is the type the return value of a non-trivial action/computation function (bundle of fields)? | `*Result` |
| Q6 | Is the type the return value of a React hook? | `*Return` |
| Q7 | Is the type a callable/function type? | `*Fn` |
| Q8 | Is the type a function's parameters tuple? | `*Params` |
| Q9 | Is the type React component props? | `*Props` |
| Q10 | Is the type a pure object bundle of fields, used as input to an internal helper with `input` parameter? | `*Input` |
| Q11 | Is the type a pure object bundle of fields (any other input/options use)? | `*Options` |

**The intuition:**
- `*Config` = user **picks** (file shape or strategy union)
- `*Options` = user **fills in** (typed bag of fields)

**Inside a `*Config` union, each pure-object variant gets `*Options`:**

```ts
// Inner variants are pure objects → *Options (Q11)
interface CookiePersistenceOptions { type: 'cookie'; name?: string; }
interface LocalStoragePersistenceOptions { type: 'local-storage'; key?: string; }
interface UrlPersistenceOptions { type: 'url'; match?: RegExp; }

// Outer union has shorthand strings + null → *Config (Q2)
type PersistenceConfig =
  | 'cookie' | 'local-storage' | 'url'
  | CookiePersistenceOptions | LocalStoragePersistenceOptions | UrlPersistenceOptions
  | null;
```

### Variable and constant names mirror the type suffix

The name describes **what the value holds**, not the domain it relates to. When a value's type carries a suffix (`*Config`, `*Options`, `*Result`, etc.), the variable/constant name carries the same suffix.

| Type | Variable | Constant |
| --- | --- | --- |
| `Persistence` | `persistence` | `PERSISTENCE` |
| `PersistenceConfig` | `persistenceConfig` | `PERSISTENCE_CONFIG` |
| `NormalizedPersistenceConfig` | `normalizedPersistenceConfig` (or `persistenceConfig` if context disambiguates) | `PERSISTENCE_CONFIG` |
| `Translator` | `translator` | `TRANSLATOR` |
| `TranslatorOptions` | `translatorOptions` | — |

```ts
// ✓ Right — name reflects what's held
export const PERSISTENCE_CONFIG: NormalizedPersistenceConfig = null;
const persistenceConfig = normalize(input);
const persistence = buildPersistence(persistenceConfig);

// ✗ Wrong — name suggests a Persistence instance, value is a config
export const PERSISTENCE: NormalizedPersistenceConfig = null;
```

This is the runtime mirror of the type-name rule: if the type ends in `*Config`, the variable holding it ends in `Config` (camelCase) or `_CONFIG` (SCREAMING_SNAKE_CASE).

### Nested fields inside `*Config`/`*Options`/`*Input`/`*Request` drop their suffix

When a field's TYPE ends in `*Config`, `*Options`, `*Input`, or `*Request`, **and** the containing interface ALSO ends in one of those suffixes, the field name drops the type's suffix. The parent name already carries that concept — repeating it on every field is noise.

**Mechanical test for a field name:**

1. Does the field's TYPE end in `*Config`, `*Options`, `*Input`, or `*Request`?
2. Does the CONTAINING INTERFACE end in `*Config`, `*Options`, `*Input`, or `*Request`?
3. If **both yes** → field name = `camelCase(typeName minus suffix)`.
4. Otherwise → field name follows the type-mirror rule (above).

| Parent interface | Field type | Field name |
| --- | --- | --- |
| `*Config` | `PersistenceConfig` | `persistence` |
| `*Config` | `CookieOptions` | `cookie` |
| `*Options` | `BatchOptions` | `batch` |
| `*Input` | `NormalizedPersistenceConfig` | `persistence` |
| `*Request` | `FilterOptions` | `filter` |
| runtime class / domain type | `PersistenceConfig` | `persistenceConfig` (keep) |
| runtime class / domain type | `TranslatorOptions` | `translatorOptions` (keep) |

```ts
// ✓ Right — parent carries the concept, field drops the suffix
interface YapyakConfig {
  persistence?: PersistenceConfig;   // YapyakConfig is *Config, field type is *Config
  translator?: Translator;           // field type has no suffix → field name = type
  processors?: Processor[];          // ditto, plural
}

interface DefineRuntimeInput {
  persistence: NormalizedPersistenceConfig;   // *Input parent, *Config field → drop
  defaultLocale: string;
}

interface CreateTranslatorOptions {
  batch?: BatchOptions;              // *Options parent, *Options field → drop
}

// ✗ Wrong — parent already carries the concept
interface YapyakConfig {
  persistenceConfig?: PersistenceConfig;   // redundant "Config"
}
```

**This exception applies only to fields.** Variables, constants, and function parameters still follow the prior rules:

```ts
// Outside an interface → type-mirror rule still applies
const persistenceConfig: PersistenceConfig = ...;                // ✓ variable mirrors type
export const PERSISTENCE_CONFIG: NormalizedPersistenceConfig;    // ✓ constant mirrors type
function normalizePersistenceConfig(config: PersistenceConfig)   // ✓ pair-rule on parameter
```

Function names are unaffected by this rule — they describe what the function does to its input, so the full type concept stays in the function name (e.g. `normalizePersistenceConfig`, `emitPersistenceConfig`).

### One type-suffix per name — no stacking

Every type carries **exactly one** suffix from the closed table. Suffix stacking is forbidden:

```ts
// ✓ Right — single suffix per name
LocalStoragePersistenceOptions
ExtractFileResult
LoadYapyakConfigResult

// ✗ Wrong — stacked suffixes
LocalStoragePersistenceConfigOptions   // Config + Options
ExtractFileRequestResult               // Request + Result
TranslatorConfigOptions                // Config + Options
UseLocaleHookReturn                    // Hook + Return
```

The suffix is determined by the type's own shape (per the mechanical test above), never by where the type is embedded. A pure-object sub-variant inside a `*Config` union is `*Options`, not `*ConfigOptions`.

### Forbidden suffixes

Suffixes that carry no information are banned outright. They never appear in type names:

| Banned suffix | Why |
| --- | --- |
| `*Instance` | Every type is implicitly an instance. The suffix says nothing. `cookie(): Persistence`, never `cookie(): PersistenceInstance`. |
| `*Object` | Vacuous — same problem. |
| `*Type` | Meta-jargon. The thing is already a type. |
| `*Class` | Meta-jargon. TypeScript classes are nominal types already. |
| `*Interface` | Meta-jargon. Same problem as `*Class`. |
| `*Impl` / `*Implementation` | The implementation IS the type. Don't shadow the interface name. |

If a `create*` factory returns `*Instance`, the type is misnamed — drop the suffix.

**Past-participle prefix pattern.** A type representing the post-processed form of a base type uses the participle as a prefix when the distinction is meaningful:

```ts
WalkedFile         // file after walk (with metadata)
ExtractedMessage   // message after extraction
NormalizedOptions  // options after normalization
```

### Function-name prefix on function-scoped types (deterministic rule)

For the function-scoped suffixes — `*Options`, `*Input`, `*Config`, `*Result`, `*Request` — the prefix is decided by a mechanical consumer count:

- **Exactly 1 function consumes it** → prefix with that function's **full name** in PascalCase.
- **2+ functions consume it** → it's a shared concept. No function prefix — use the concept name.

```ts
// ✓ Single consumer — full function name
function resolveLocale(options: ResolveLocaleOptions) { ... }
function syncLocaleFiles(options: SyncLocaleFilesOptions) { ... }
function createClient(c, b, options: CreateClientOptions) { ... }

// ✓ Shared concept — no function prefix
const cache: Cache = ...                  // used by many
const params: TParams<T> = ...            // used by t() AND user wrappers
```

For domain suffixes (`*Entry`, `*Item`, `*Context`, `*Tree`, `*Position`, `*Site`, `*Range`, `*Pattern`, `*Level`, `*Stats`, `*Data`), the prefix is always the **concept noun** — never a function name. These types are *things*, not function-input bundles.

**Parameter name and type suffix are paired.** Pick whichever bundle name reads naturally at the call site, then the suffix is mechanically determined:

| Parameter name | Type suffix |
| --- | --- |
| `options` | `*Options` |
| `input` | `*Input` |
| `config` | `*Config` |
| `request` | `*Request` |

```ts
// ✓ Right — paired
function resolveLocale(options: ResolveLocaleOptions) { ... }
function findExpressionOffset(input: FindExpressionOffsetInput) { ... }
function buildPersistence(config: NormalizedPersistenceConfig, locales: string[]) { ... }
function translateBatch(request: TranslateBatchRequest) { ... }

// ✗ Wrong — mismatched
function findExpressionOffset(input: FindExpressionOffsetOptions) { ... }
function resolveLocale(options: ResolveLocaleInput) { ... }
function buildPersistence(config: NormalizedPersistenceOptions, locales: string[]) { ... }
```

`options` reads naturally for atomic options bundles; `input` for internal helpers; `config` for user-facing configuration shapes (file or DSL union); `request` for operation requests. Pick by the call site, then suffix the type to match.

### Platform-API mirroring

A parameter or option-field name that mirrors a platform or standard-library key keeps the platform name verbatim, even when it repeats the enclosing function or method name. This overrides [[general]] § Don't repeat context across argument names: the call site should read as the platform API the user already knows.

```ts
// ✓ `currency` mirrors Intl.NumberFormat's `currency` option; kept despite repeating the method.
format.currency(value: number, currency: string, options?: Intl.NumberFormatOptions): string;
```

### Function verb prefix vocabulary

Closed list. Every function starts with one of these (or follows an exception documented below).

| Prefix | Purpose | Example |
| --- | --- | --- |
| `get*` | Pure getter — no side effects, no async | `getLocale()` |
| `set*` | Mutator — updates state, may notify | `setLocale(locale)` |
| `reset*` | Restore state to default | `resetLocale()` |
| `has*` | Boolean check — "does this have X?" | `hasPlaceholder()`, `hasPath()` |
| `is*` / `are*` | Boolean state — "is/are this(these) X?" | `isPlainObject()`, `areMessagesEqual(a, b)` |
| `find*` | Search — returns first match or `null`/`undefined` | `findCallSites()` |
| `detect*` | Identify pattern/anomaly in data | `detectRenames()` |
| `format*` | Format a value to a string (Intl-style) | `formatDate()` |
| `stringify*` | Serialize a value to a string (JSON.stringify-style) | `stringifyCanonical()` |
| `to*` | Convert a value into another shape | `toDate()`, `toPositionKey()` |
| `use*` | React hook | `useLocale()` |
| `parse*` | String → structured value | `parseCookie()` |
| `resolve*` | Compute final value from inputs | `resolveLocale()` |
| `extract*` | Pull a subset out of larger data | `extractMessages()` |
| `transform*` | Map A → B preserving structure | `transformSource()` |
| `remap*` | Rewrite coordinates/positions in-place | `remapPosition()`, `remapRange()` |
| `strip*` | Remove wrapper/prefix/suffix from value | `stripCodeFence()` |
| `interpolate*` | Fill template placeholders | `interpolate()` |
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
| `auto*` | Automated variant of a base operation | `autoTranslate()` |
| `with*` | Run a callback inside an async scope | `withRequest()` |
| `register*` | Add to an internal registry | `registerTracker()` |
| `subscribe*` | Observer pattern, returns unsubscribe | `subscribeLocale()` |
| `run*` | Execute registered side effects | `runTrackers()` |
| `pick*` / `omit*` | Subset operations | `pick()` |
| `walk*` | Recursive traversal | `walkSourceFiles()` |
| `build*` | Construct a complex object | `buildOperationTree()` |
| `sync*` | Bring two stores into agreement | `syncLocaleFiles()` |
| `merge*` | Combine entries from a source store into a target | `mergePendingResponseHeaders()` |
| `invalidate*` | Mark cached/derived state as stale | `invalidateData()` |
| `reload*` | Trigger a refetch/re-execution of an upstream resource | `reloadModule()` |
| `warn*` | Diagnostic-emitting function paired with the project's `warn` / `warnDiagnostic` primitive | `warnDiagnostic()`, `warnUnsupportedCurrencyOnce()` |
| `inject*` | Insert generated code into an existing source string via mutation | `injectComponentHooks()` |
| `try*` | Attempt an operation that may succeed — returns the result or `undefined` | `tryBareElision()` |

#### Composite `*To*` / `*From*` converters

Allowed when the verb is "convert" and **both endpoints of the conversion belong in the name**:

```ts
blockToText(block): string         // Block → Text
rangeFromOffsets(start, end): Range // construct Range from raw offsets
```

The pattern is `<sourceShape>To<targetShape>` or `<targetShape>From<sourceShape>`. Use this when a plain `to*` prefix would lose information about what's being converted.

Avoid for simple conversions where the source is obvious from context — `toDate(value)` beats `valueToDate(value)`.

#### Well-known utility verbs

Standard JS/ecosystem utility names are allowed without belonging to the closed list, when the name is **a widely-recognized utility-library verb**:

```ts
slugify(text): string       // ecosystem standard (Lodash, GitHub Pages, etc.)
debounce(fn, ms): function  // ecosystem standard (Lodash, RxJS, etc.)
```

Test: would a TypeScript developer recognize this verb from `lodash`, `remeda`, `rxjs`, or similar mainstream utility libraries? If yes — allowed. If no — pick from the closed list.

#### Factory-by-name pattern

Functions that return a domain object can use the **bare noun-name of what they produce** instead of a verb prefix, when the function IS the public constructor for that concept:

```ts
// Translator factories — function name = translator id
anthropic(options): Translator
openai(options): Translator
gemini(options): Translator

// Persistence factories — function name = persistence kind
cookie(options): Persistence
localStorage(options): Persistence
url(options): Persistence

// Bundler plugin factories — function name = plugin name
yapyak(): Plugin            // @yapyak/vite's plugin
docCompiler(options): Plugin // @yapyak/doc-compiler's plugin
```

Rule: ONE noun-named factory per concept per package. If multiple variants exist, use `create*` prefixes (`createAnthropicClient`, `createOpenAIClient`) and disambiguate.

#### CLI command handlers

When a function is a 1:1 handler for a user-typed CLI command, it can carry the **command verb directly** without a closed-list prefix:

```ts
add()       // yapyak add
check()     // yapyak check
translate() // yapyak translate
status()    // yapyak status
```

When the command verb collides with a JS reserved word, suffix with `Command`:

```ts
exportCommand()  // yapyak export — `export` is reserved
```

This exception is scoped to CLI command files (`commands/*.ts`). Internal helpers in CLI code still follow the closed list.

#### TUI primitives

Terminal/text-UI primitive functions that produce or control a UI element use the **noun-name of the element** they make:

```ts
spinner(text): SpinnerController
prompt(question): Promise<string>
confirm(question): Promise<boolean>
progressBar(done, total): string
header(title): string
indent(level): string
```

Scoped to TUI helper files (e.g., `tui.ts`). These are essentially factories but for terminal UI atoms — by-name reads naturally.

### Generics

- **One type parameter:** use `T`.
- **Two or more type parameters:** prefix each with `T` and use a descriptive, unabbreviated name — `TKey`, `TValue`, `TSource`, `TAccumulator`.
- Never abbreviate (`Acc`, `Src`, `K`, `V`).

```ts
// ✓
type TParams<T extends string> = ...
type ExtractTParams<TSource extends string, TAccumulator = unknown> = ...

// ✗
type ExtractTParams<S extends string, Acc = unknown> = ...
type Record<Key extends string, Value> = ...    // multi-generic without T-prefix
```

### No abbreviations

Extends [[general]] § Naming. TypeScript-specific exception:

**Exception:** `Array.prototype.sort` comparators use `(a, b)` — canonical idiom.

```ts
items.sort((a, b) => a.order - b.order);
```

### Boolean naming

The rule depends on **where** the boolean lives. Standalone variables and object properties follow different conventions because they're read differently — `if (isActive)` reads as a sentence; `<Button disabled />` reads as an attribute.

**Three rules:**

1. **Fresh boolean variables** (created via `useState`, `const x = expr`, `let`, function returns) — ALWAYS carry `is*`/`has*`/`can*`/`should*`/`will*`/`was*`/`are*` prefix.
2. **Object property fields** (interface fields, context values, options, config, props) — NEVER carry that prefix. Bare adjective or verb-phrase.
3. **Crossing the boundary:**
   - **Fresh variable → property** (assignment INTO an object): ALIAS `{ property: variable }`. The alias bridges rule 1 to rule 2.
   - **Property → local binding** (destructuring OUT of props/context/options): KEEP the bare property name. No alias needed — the parameter/destructure context already carries the meaning; renaming is pure ceremony.

```ts
// ✓ Right — fresh useState carries prefix (rule 1), property bare (rule 2),
//   assignment into property aliases (rule 3)
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
interface ContextValue { sidebarOpen: boolean; closeSidebar: () => void; }
return (
  <Context value={{ sidebarOpen: isSidebarOpen, closeSidebar }}>
);

// ✓ Right — destructuring out: keep the bare property name
const { sidebarOpen } = useContext(Context);
if (sidebarOpen) { /* reads fine in local scope */ }

function Drawer(props: DrawerProps) {
  const { open, direction } = props;   // bare, no alias
  return <Box data-open={open ? '' : undefined} />;
}

// ✓ Also fine — alias on destructure only if the bare name would shadow / be ambiguous

// ✗ Wrong — fresh variable without prefix to avoid the assignment-side alias
const [sidebarOpen, setSidebarOpen] = useState(false);

// ✗ Wrong — object property with prefix to match a variable
interface ContextValue { isSidebarOpen: boolean; ... }

// ✗ Wrong — pointless alias on destructure-out (rule 3)
const { sidebarOpen: isSidebarOpen } = useContext(Context);
```

JSX prop binding (`<MenuButton open={isMenuOpen} />`) is **not** aliasing — `open` is the component's prop name (bare per rule 2), `isMenuOpen` is the local variable (prefix per rule 1). Different names is normal variable-to-prop passing, no alias needed.

#### Standalone variables and function returns

Must carry one of these prefixes:

| Prefix | Meaning | Example |
| --- | --- | --- |
| `is*` | State / classification | `isLoading`, `isPlainObject` |
| `has*` | Possession / presence | `hasError`, `hasPlaceholder` |
| `can*` | Ability / permission | `canEdit` |
| `should*` | Recommendation / decision | `shouldRefetch` |
| `will*` | Future state | `willClose` |
| `was*` | Past state | `wasFetched` |
| `are*` | Plural state | `areMessagesEqual` |

```ts
const isActive = status === 'active';
function hasError(state: State): boolean { /* ... */ }
const shouldRefetch = stale && online;
```

#### Object properties (interface fields, props, options, config)

**No prefix.** Choose the form by what the field means:

| Category | Form | Examples |
| --- | --- | --- |
| **State** — what the thing *is* | bare adjective / state noun | `disabled`, `selected`, `open`, `hidden`, `loading`, `checked`, `expanded` |
| **Behavior flag** — what `true` *does* | **verb phrase** | `syncHtmlLang`, `detectUserLocale`, `preserveTranslationsOnRename`, `minify`, `usePolling`, `clearScreen`, `renderLegacyChunks`, `emptyOutDir` |
| **Artifact emitter** — the noun *is* the output | bare noun (the output's name) | `sourcemap`, `manifest`, `polyfills` |

**Quick test:** ask "what does `field: true` cause?"

- "The thing *is* X" → **state** form
- "The system *does* X" → **verb** form
- "An X is produced" → **artifact** form

**Bare nouns as behavior flags are forbidden.** Use a verb phrase instead — `htmlLang` → `syncHtmlLang`, `acceptLanguage` → `detectUserLocale`.

#### Typed-value fields and parameters — name mirrors the type, unless context carries it

When a field or parameter holds a value of a specific named type, the name is the **type name in camelCase**. No abbreviations.

| Case | Name | Example |
| --- | --- | --- |
| Holds a single named type, no surrounding context carries it | type name in camelCase | `attributeNode: AttributeNode` |
| Holds any of several variants (polymorphic) | generic concept noun | `node: AstNode` (when `AstNode` is a union of node kinds) |
| Holds a collection of one named type | plural of type name | `attributeNodes: AttributeNode[]` |

```ts
// ✓ Field — interface name is generic, so field mirrors the type
interface FindExpressionOffsetOptions {
  attributeNode: AttributeNode;
  code: string;
  source: string;
}

// ✓ Polymorphic — generic noun, because `AstNode` is a union
interface WalkContext {
  node: AstNode;
}

// ✗ Wrong — abbreviated field name when the type is known
interface FindExpressionOffsetOptions {
  attr: AttributeNode;   // "attr" hides the type; expand to `attributeNode`
}
```

**Context-carry exception — mechanical rule.** When a function operates on a single named type, the function name carries the **full type name** as its noun part, and the parameter drops to the **generic noun from the type's last PascalCase segment**:

| Type | Function name shape | Parameter name |
| --- | --- | --- |
| `AttributeNode` | `[verb]AttributeNode` | `node` |
| `CallSite` | `[verb]CallSite` | `site` |
| `MessageContext` | `[verb]MessageContext` | `context` |
| `TranslateRequest` | `[verb]TranslateRequest` | `request` |

```ts
// ✓ Right — function name carries the full type, parameter is the generic last-segment noun
function handleAttributeNode(node: AttributeNode): void { ... }
function getAttributeNodeExpression(node: AttributeNode): string { ... }
function resolveCallSite(site: CallSite): ResolvedSite { ... }

// ✓ Right — collection name carries "attributes", loop variable is generic
for (const node of element.attributes) { ... }

// ✗ Wrong — function name truncates the type concept
// "Attribute" ≠ "AttributeNode"; reader cannot tell what's handled
function handleAttribute(node: AttributeNode): void { ... }

// ✗ Wrong — function name carries the full type, parameter repeats it
function handleAttributeNode(attributeNode: AttributeNode): void { ... }
```

This is a special case of the **no abbreviations** rule (§ No abbreviations): expand abbreviations to the type-derived name, except where the surrounding context already supplies that name.

```ts
// ✓ State — bare adjective
<Button disabled selected />

// ✓ Behavior flag — verb phrase
yapyak({ syncHtmlLang: true, detectUserLocale: true })

// ✓ Artifact emitter — bare noun
defineConfig({ build: { sourcemap: true, manifest: true } })

// ✗ Behavior flag as bare noun — ambiguous
yapyak({ htmlLang: true })          // sync it? detect it? render it?
yapyak({ acceptLanguage: true })    // detect it? forward it? translate to it?
```

When a public option flows through internal layers (normalized options, virtual module constants, etc.), the **same name** carries through every layer — never reintroduce a prefix mid-chain. The chain `detectUserLocale` (option) → `detectUserLocale` (normalized) → `DETECT_USER_LOCALE` (virtual constant) is correct; `shouldDetectAcceptLanguage` mid-chain is not.

### String-literal values

String literals used as discriminator tags, enum-like values, or domain identifiers — anywhere a value is *our* choice rather than a name from an external API — use **kebab-case**.

```ts
// ✓ Right
type Persistence = 'cookie' | 'local-storage' | 'url' | null;
type Mode = 'serve' | 'build' | 'preview';
{ severity: 'warn-once' }
{ kind: 'template-expression' }

// ✗ Wrong — camelCase looks like a JS identifier but is a string
type Persistence = 'cookie' | 'localStorage' | 'url' | null;
{ kind: 'templateExpression' }

// ✗ Wrong — PascalCase reserved for type names
{ severity: 'Warning' }
```

**Why kebab-case:**
- Consistent with file names, CSS classes, HTML `data-*` attributes, CLI flags, URL slugs — every other kebab-case context in the codebase
- Visually distinct from identifiers (`localStorage` the property vs `'local-storage'` the value)
- Reads as data, not code

**Exception — match the external identifier exactly:**

When the literal MUST equal a name from outside our codebase, preserve the external spelling.

```ts
// ✓ Right — these are actual React function names
const HOC_NAMES = new Set(['forwardRef', 'lazy', 'memo', 'observer']);

// ✓ Right — these are HTTP header schemes
{ scheme: 'Bearer' }

// ✓ Right — global API name
vi.stubGlobal('localStorage', mockStorage);

// ✓ Right — DOM event name
element.addEventListener('DOMContentLoaded', ...);
```

The rule applies to literals *we own*. When the literal is a name the platform/library defined, we follow theirs.

### Regex naming

Regex literals stored in named bindings carry an `_RX` / `Rx` suffix so the name signals "this is a pattern, not a value":

| Context | Form | Example |
|---|---|---|
| Top-level constant | `UPPER_SNAKE_RX` | `EMAIL_RX`, `KEBAB_CASE_RX`, `LOCALE_CODE_RX` |
| Local variable | `camelCaseRx` | `const slugRx = /^[a-z]+$/;` |

The suffix is mandatory for any binding whose value is a `RegExp`. Without it, `EMAIL` reads as a string of an email, not a pattern that matches one.

Inline regex (used once, not assigned to a name) needs no suffix — the literal itself is self-describing.

```ts
// ✓ Right — pattern bindings carry the suffix
const SLUG_RX = /^[a-z0-9-]+$/;
const CURRENCY_WITH_CODE_RX = /^currency\s+\S+$/;
const localeRx = new RegExp(`^${prefix}-`);

// ✓ Right — inline use needs no suffix
if (/^\d+$/.test(value)) { ... }

// ✗ Wrong — binding without suffix reads like a string
const SLUG = /^[a-z0-9-]+$/;
const currencyWithCode = /^currency\s+\S+$/;
```

### Map and Set naming

**Set** — always a plural noun describing the elements: `listeners`, `trackers`, `seen`, `aliases`.

**Map** — pick by purpose:

| Purpose | Pattern | Example |
| --- | --- | --- |
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
