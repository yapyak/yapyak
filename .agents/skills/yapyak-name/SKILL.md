---
name: yapyak-name
description: "Naming: filename derivation, type suffixes, discriminator fields, boolean prefixes, singular-vs-plural, no-abbreviation. Use when naming a file, folder, type, symbol, or boolean."
---

Every rule here is a deterministic operation on an export or type name. The only human input is coining a brand-new domain noun — itself bound by the suffix and form rules. No taste, no judgment.

### Files and folders

- All files and folders use `kebab-case`. No exceptions.
- Filename derives from the primary export via the algorithm below — kebab-case, leading verb dropped. `createStorage` → `storage.ts`; `useLocale` → `use-locale.ts` (hooks keep `use`).
- When only one of a kind exists in a module, drop qualifiers: `vite/parser.ts`, not `vite/vite-parser.ts`.

### Mechanical filename derivation

Filename derives from the primary export through a deterministic algorithm. No closed list of verbs to maintain. The **primary export** is the one the file's concept is named for; with 2+ co-equal exports it is the public entry point the others support (per [[yapyak-module]] § Coherent module), and if still tied, the first in source order.

**Two keep-the-name exceptions:** `utils/` (whole name, step 0) and `use*` hooks (keep the `use` prefix, step 2). Everything else drops the leading verb.

```
ALGORITHM:
  0. If the file is in `utils/`, filename = kebab-case(primary export name) verbatim — skip steps 2–6 (no verb-drop, no singularize). A concept name applies only when 2+ functions share the file; see § `utils/` and `helpers/`.
  1. Kebab-case the primary export name.
  2. Drop the FIRST segment (the verb — always, no list lookup). Exception: a leading `use` is kept (React hooks: `useLocale` → `use-locale.ts`).
  3. While first remaining segment is in PREPOSITION list, drop it.
  4. While first remaining segment is in MODIFIER list, drop it.
  5. Singularize the trailing segment.
  6. If parent-folder name equals any remaining segment, drop it.
  7. If filename is empty (everything stripped), fall back to the verb.
```

**The closed lists:**

```
PREPOSITION (10):
  with, from, to, in, for, of, by, into, onto, at, on

MODIFIER (~25):
  Quantifiers:  all, any, every, none, no
  Positions:    first, last, next, prev, previous, current, latest, oldest
  Relations:    adjacent, parent, child, sibling, root, leaf, top, bottom
  Selectors:    default, primary, secondary, tertiary
  Auto-prefix:  auto

IRREGULAR PLURALS (8):
  children, people, men, women, mice, feet, teeth, geese

HOST-INTEGRATION FILENAMES (4):
  plugin, middleware, handle, integration
```

Step 4 drops a leading segment **iff it is literally in the MODIFIER closed list** — never by judging meaning. (`internal` is not in the list → kept; `first` is → dropped.)

**Singularize rules** — apply top-down, first match wins:

- Irregular plural in the closed list → its singular.
- Trailing `ies` → `y` (`entries` → `entry`).
- Trailing `es` after a sibilant stem (ends `s`, `x`, `z`, `ch`, `sh`) → drop `es` (`boxes` → `box`).
- Trailing segment ends in `ss`, `us`, or `is`, or is in the closed exception list (`status`, `address`, `process`, `bias`, `lens`, `series`, `news`, `props`) → leave unchanged.
- Trailing `s` → drop (`pages` → `page`).

**Worked examples:**

| Export | Trace | Filename |
| --- | --- | --- |
| `getAllPages` | drop `get` → AllPages → drop `all` → Pages → Page | `page.ts` |
| `walkSourceFiles` | drop `walk` → SourceFiles → SourceFile | `source-file.ts` |
| `useLocale` | `use` kept (hook); kebab the rest | `use-locale.ts` |
| `createStorage` | drop `create` → Storage | `storage.ts` |
| `wrapWithProgress` | drop `wrap` → WithProgress → drop `with` → Progress | `progress.ts` |
| `toMessageId` | drop `to` → MessageId | `message-id.ts` |
| `interpolate` | drop `interpolate` → empty → fall back | `interpolate.ts` |
| `t` | drop `t` → empty → fall back | `t.ts` |

### Attribute-getter collapse

The algorithm above derives the filename from the export's own name. When that name is `verb` + `<Subject>` + `<Attribute>` and the export merely computes a **primitive attribute of a domain object it already receives**, the file is the subject's — not a compound `<subject>-<attribute>.ts`. `Title` is an attribute of `Page`, so `getPageTitle` lives in `page.ts`, just as `getFirstPage` does — and for the same reason there is no `first-page.ts`.

Mechanical test — a compound name collapses to its subject **iff all three hold**:

1. The return type is a primitive (`string`, `number`, `boolean`) — not a domain type, array, object, `void`, or `never`.
2. The first parameter is a domain type `T`.
3. The name's noun (after the verb drop) begins with `T` — i.e. the name is `verb` + `T` + `Attribute`.

Then the filename is `kebab-case(T)` (parent-strip still applies); the `Attribute` tail is dropped.

| Export | Signature | Collapses? | Filename |
| --- | --- | --- | --- |
| `getPageTitle` | `(page: Page) => string` | ✓ all three | `page.ts` |
| `getMessageContext` | `(message: Message) => string` | ✓ all three | `message.ts` |

**When it does NOT collapse — the compound name stands:**

| Export | Signature | Why it stands |
| --- | --- | --- |
| `buildMarkdownSidebar` | `() => SidebarNode[]` | Fails (1): returns a domain type. The file names a concept/role, not an attribute. |
| `renderErrorDiagnostics` | `(…) => Diagnostic[]` | Fails (1): returns a domain type. `error-diagnostic` is a role, not an attribute of `Diagnostic`. |
| `toMessageKey` | `(source: string) => string` | Fails (2): the first parameter is a primitive, not a subject. |
| `buildSymbolHref` | `(moduleId: string, …) => string` | Fails (2): the first parameter is a primitive, not a subject. |

A producer that returns a domain type is named for its own concept even when several such files return the same type — `markdown-sidebar.ts` and `package-root.ts` both yield `SidebarNode` yet stay distinct. Collapse applies only to a primitive attribute read of a subject the function already holds.

### Folder threshold

```
Create folder X iff 2+ files in the same parent would resolve to the same name.
```

The algorithm drives this — when two files compute to the same name, create a folder named after that shared name. The parent-strip step shortens inner filenames.

```
extractFile    → file.ts
transformFile  → file.ts
                 ↓ COLLISION
Create folder file/:
  parser/file/extract.ts    (parent strips File)
  parser/file/transform.ts
```

### Host-integration exception

These filenames are framework-vocabulary, not derived from exports:

```
plugin.ts        bundler plugin factory
middleware.ts    router middleware factory
handle.ts        SvelteKit handle hook
integration.ts   Astro/Nuxt integration factory
```

### Test files mirror source files

A `.test.ts` file's name matches its source file exactly.

```
✓ argument.ts        ↔  argument.test.ts
✓ extract.ts         ↔  extract.test.ts

✗ translate.ts       ↔  auto-translate.test.ts
✗ canonical.ts       ↔  json.test.ts
✗ <no source>        ↔  fixtures.test.ts
```

For technical multi-test cases (e.g. separate `vi.mock` configs), use `<source>.<variant>.test.ts`:

```
✓ store.ts ↔ store.test.ts ↔ store.url.test.ts
```

### `index.ts` is always a barrel

`index.ts` never contains implementation. It exists for one purpose: re-exporting from named files.

| Lives in | What |
|---|---|
| `index.ts` | `@packageDocumentation`, `export {...} from ...` re-exports, `import './x';` side-effect imports. Nothing else. |
| Named file | Implementation. JSDoc on the export. |

Named imports (`import { X } from './x'`) and default imports are forbidden in barrels.

### React hook exception

React hook files keep the `use-` prefix:

```
use-locale.ts    exports useLocale()
use-query.ts     exports useQuery()
```

### Singular vs plural

**Domain-specific** files and folders are always singular. Plural only for collection variables.

```ts
const locale = 'sv';
const locales = ['en', 'sv'];

cookie.ts, locale.ts, endpoint.ts       // singular files
adapter/, locale/, runtime/             // singular folders
cli/command/, route/, fixture/          // singular folders (peer instances)
```

**App-code exception.** App-package scaffolding keeps its conventional (often plural) names — `components/`, `hooks/`, `routes/`, `styles/`, `utils/`, and a shared `types.ts` — framework vocabulary, not domain concepts. The rule still governs domain names *inside* them: `lib/page.ts` not `pages.ts`, `hero-demo.ts` not `hero-demo-scenes.ts`. Library code (`packages/*`) has no scaffolding and follows it strictly.

### Type-only files

Split by concept, not by code kind. A persistence type and a persistence encoder belong in the same file.

```
NormalizedPersistence  → drop "Normalized" → persistence  →  persistence.ts
emitPersistence        → drop "emit"       → persistence  →  persistence.ts
```

`type.ts` is justified only when the types ARE the concept — they form the shared vocabulary of a package and no narrower noun captures all of them.

```ts
// ✓ — compiler/src/parser/type.ts: 22 types that ARE the parser vocabulary
export type CallSite = { ... };
export type Diagnostic = { ... };
export type ProcessorKind = ...;
```

When you can name the file after the noun the types share (`persistence`, `binding`, `block`), use that noun. `type.ts` is the fallback when no shared noun exists.

`type.ts` is always singular; `types.ts` is forbidden in library code. A shared `types.ts` of cross-cutting primitives is allowed in app code only (scaffolding exception).

### Record-shaped types

`Record<K, V>` types follow a two-step rule.

**Step 1 — role-suffix from the closed list:**

| Suffix | Role | Example |
|---|---|---|
| `*Cache` | Expensive-to-recompute kept around — in-memory memoization OR file-backed regenerable storage | `OrphanCache` |
| `*Snapshot` | Point-in-time view of mutable state | `LocaleSnapshot` |
| `*Catalog` | Authoritative index keyed by domain identifier | `MessageCatalog` |
| `*Registry` | Mutable collection of registered handlers/factories | `TrackerRegistry` |
| `*File` | Shape of a single file's contents | `LocaleFile` |

**Step 2 — no role applies:**

- Value is a **single named type** → its plural: `Record<string, Template>` → `Templates`. If the value type is already plural or carries a type suffix, fall through to the primitive/union rule below.
- Value is a **primitive or union** → a plural noun for what the values represent — the one place a concept is coined; it must be a plural noun:

```ts
type LocaleTranslations = Record<string, string>;        // primitive value
type Variants = Record<string, string | Template>;       // union value
```

`*Dict` is forbidden.

### `utils/` and `helpers/`

Forbidden in **library code** (published `packages/*`). Every utility has a concept — name the file after it.

| Situation | Correct response |
| --- | --- |
| 1 utility, 1 consumer | Inline at consumer |
| 1 utility, 2+ consumers | Own file — concept name or full function name (`pluralize.ts`, `merge-refs.ts`) |
| Multiple unrelated utilities | Split into concept files |
| Multiple tightly-related utilities | Merge into concept file (`string-format.ts`) |

**App-code exception.** Private app packages MAY keep a single top-level `src/utils/` for **pure, domain-agnostic** helpers (the `lib/` vs `utils/` split lives in [[yapyak-module]] § `lib/` vs `utils/` in apps). Domain-aware code goes in `lib/`, never `utils/`. `helpers/` stays forbidden everywhere, library and app alike.

A single-function `utils/` file is named after its **full function name** — kebab-cased with no verb-drop and no singularization (`mergeRefs` → `merge-refs.ts`, `normalizeProps` → `normalize-props.ts`). A concept name applies only when 2+ functions share the file (`string-format.ts`). The general filename algorithm's stripping and singularizing never apply in `utils/`.

### Type suffix vocabulary

Closed list. Extend before coining.

| Suffix | Meaning | Example |
| --- | --- | --- |
| `*Options` | Pure object bundle of fields, used as input. Paired with `options` parameter. | `CookieOptions` |
| `*Input` | Bundle of inputs to an internal helper. Paired with `input`. | `ApplyOrphanMutationsInput` |
| `*Config` | User configuration. Disk-loaded file shape OR a union with strategy shortcuts. Paired with `config`. | `YapyakConfig`, `PersistenceConfig` |
| `*Result` | Return of a computation: an object with 2+ fields OR a `changed`/status flag (never a single scalar or single domain object) | `ExtractFileResult` |
| `*Entry` | A single key-value pair in a collection/map | `CacheEntry` |
| `*Item` | A single element in an ordered sequence | `TranslateItem` |
| `*Context` | Bundle of state passed through a flow | `MessageContext` |
| `*Tree` | Nested or recursive data structure | `EndpointTree` |
| `*Stats` | Aggregated metrics | `LocaleStats` |
| `*Data` | Raw data bundle | `LocaleData` |
| `*Position` | Location in source/file | `MessagePosition` |
| `*Site` | Location enriched with context | `CallSite` |
| `*Range` | Span or extent | `ArgsRange` |
| `*Pattern` | Matcher (regex-like) | `FilterPattern` |
| `*Level` | Ordinal/enum classification | `ContextLevel` |
| `*Accessor` | Structural read/write interface to an external surface | `SlotAccessor` |
| `*Request` | Input data for an operation | `TranslateBatchRequest` |
| `*Error` | Custom error class | `DomainError` |
| `*Conflict` | A collision between concurrent or candidate operations | `RenameConflict` |
| `*Component` | Framework component callable | `RichTextComponent` |
| `*Props` | React component props | `IntlProviderProps` |
| `*Slots` | Vue component slots | `RichTextSlots` |
| `*Return` | Hook return type | `UseLocaleReturn` |
| `*Fn` | Callable / function type | `TFn` |
| `*Params` | A function's parameters type | `TParams` |
| `*Tag` / `*Kind` | Discriminator string for union types | — |

### Suffix selection — mechanical test

Apply top-down. First match wins. No two questions can both apply.

| Step | Question | If yes → suffix |
| --- | --- | --- |
| Q1 | Is the type the exported shape of a disk-loaded config file? | `*Config` |
| Q2 | Is the type a union including shorthand alternatives (strings, primitives, `null`)? | `*Config` |
| Q3 | Does the type match a domain suffix (`*Context`, `*Data`, `*Entry`, `*Item`, `*Stats`, `*Position`, `*Site`, `*Range`, `*Pattern`, `*Level`, `*Tree`, `*Accessor`, `*Conflict`)? | the matching domain suffix |
| Q4 | Is the type a custom error class (extends `Error`)? | `*Error` |
| Q5 | Is the type the return of a computation — an object with 2+ fields or a `changed`/status flag (not a single scalar or domain object)? | `*Result` |
| Q6 | Is the type the return value of a React hook? | `*Return` |
| Q7 | Is the type the callable type of a framework component? | `*Component` |
| Q8 | Is the type a callable/function type? | `*Fn` |
| Q9 | Is the type a function's parameters tuple? | `*Params` |
| Q10 | Is the type React component props? | `*Props` |
| Q11 | Is the type a Vue component's slots? | `*Slots` |
| Q12 | Is the type a pure object bundle, used as input to an internal helper with `input` parameter? | `*Input` |
| Q13 | Is the type a pure object bundle (any other input/options use)? | `*Options` |

**Intuition:**

- `*Config` = user **picks** (file shape or strategy union)
- `*Options` = user **fills in** (typed bag of fields)
- `*Input` = **internal helper** takes a structured bundle (parameter literally named `input`)

**Field optionality is NOT part of the test.** A `*Options` type may have required fields, optional fields, or both. The suffix is decided by call-site role, not by counting `?` markers.

```ts
// ✓ — public factory with required field. Q13 → *Options.
type AnthropicOptions = {
  apiKey: string;
  model?: string;
};
export function anthropic(options: AnthropicOptions): Translator { ... }

// ✓ — internal helper. Q12 → *Input.
type ExtractFileInput = {
  fileId: string;
  source: string;
  processors: Processor[];
};
function extractFile(input: ExtractFileInput): ExtractFileResult { ... }
```

**Forbidden reasoning:**

- ✗ "This `*Options` type has a required field → must be `*Input`." Wrong — Q13 does not ask about optionality.
- ✗ "All-optional bundles must be `*Options`, anything else `*Input`." Wrong — same reason.

**Inside a `*Config` union, each pure-object variant gets `*Options`:**

```ts
type CookiePersistenceOptions = { type: 'cookie'; name?: string };
type LocalStoragePersistenceOptions = { type: 'local-storage'; key?: string };

// Outer union with shorthand strings + null → *Config (Q2)
type PersistenceConfig =
  | 'cookie' | 'local-storage' | 'url'
  | CookiePersistenceOptions | LocalStoragePersistenceOptions
  | null;
```

### Variable and constant names mirror the type suffix

The name describes what the value holds. When a value's type carries a suffix, the variable/constant name carries the same suffix.

| Type | Variable | Constant |
| --- | --- | --- |
| `Persistence` | `persistence` | `PERSISTENCE` |
| `PersistenceConfig` | `persistenceConfig` | `PERSISTENCE_CONFIG` |
| `NormalizedPersistenceConfig` | `normalizedPersistenceConfig` (drop a participle prefix like `normalized` only when an identically-named binding without it is already in scope in the same function body) | `PERSISTENCE_CONFIG` |
| `Translator` | `translator` | `TRANSLATOR` |
| `TranslatorOptions` | `translatorOptions` | — |

### Nested fields inside `*Config`/`*Options`/`*Input`/`*Request` drop their suffix

When a field's TYPE ends in `*Config`, `*Options`, `*Input`, or `*Request`, AND the containing type also ends in one of those suffixes, the field name drops the type's suffix.

**Mechanical test for a field name:**

1. Does the field's TYPE end in `*Config`/`*Options`/`*Input`/`*Request`?
2. Does the CONTAINING TYPE end in one of those suffixes?
3. If both yes → field name = `camelCase(typeName minus suffix)`.
4. Otherwise → field name follows the type-mirror rule.

```ts
// ✓ — parent carries the concept, field drops the suffix
type YapyakConfig = {
  persistence?: PersistenceConfig;
  translator?: Translator;
  processors?: Processor[];
};

type DefineRuntimeInput = {
  persistence: NormalizedPersistenceConfig;
  defaultLocale: string;
};
```

This applies only to fields. Variables, constants, and function parameters still follow the type-mirror rule.

### One type-suffix per name

Every type carries exactly one suffix. Suffix stacking is forbidden.

```ts
// ✓
LocalStoragePersistenceOptions
ExtractFileResult

// ✗ Stacked
LocalStoragePersistenceConfigOptions    // Config + Options
ExtractFileRequestResult                // Request + Result
TranslatorConfigOptions                 // Config + Options
UseLocaleHookReturn                     // Hook + Return
```

### Forbidden suffixes

| Forbidden suffix | Why |
| --- | --- |
| `*Instance` | Every type is implicitly an instance |
| `*Object` | Vacuous |
| `*Type` | Meta-jargon **when redundant** — the base noun is already a type (`OptionsType`, `ConfigType`) |
| `*Class` | Meta-jargon |
| `*Interface` | Meta-jargon |
| `*Impl` / `*Implementation` | The implementation IS the type |

**`*Type` exception — a discriminator category on the public surface.** `*Type` is allowed only when it names the category of a **public** discriminated union whose field is `type` (see § Discriminator fields). The type name and field must agree: field `type` ↔ type `*Type`; field `kind` ↔ type `*Kind`.

```ts
// ✓ Allowed — public discriminator, field `type`, so its category is `*Type` (à la `ContentType`)
type Event = { type: EventType; ... };
type EventType = 'click' | 'submit' | ...;

// ✗ Internal discriminator uses `kind`, so its category is `*Kind`, never `*Type`
type Token = { kind: TokenKind; value: string };   // internal IR → kind → TokenKind

// ✗ Redundant: Options/Config are ALREADY types, "Type" adds nothing
type OptionsType = { ... };   // → Options
type ConfigType = { ... };    // → Config
```

**Past-participle prefix pattern.** A type representing the post-processed form of a base type uses the participle as a prefix:

```ts
WalkedFile         // file after walk
ExtractedMessage   // message after extraction
NormalizedOptions  // options after normalization
```

### Function-name prefix on function-scoped types

For `*Options`, `*Input`, `*Config`, `*Result`, `*Request` — prefix decided by consumer count:

- **Exactly 1 function consumes it** → prefix with that function's full name in PascalCase.
- **2+ functions consume it** → no function prefix, use the concept name.

```ts
// ✓ Single consumer — full function name
function resolveLocale(options: ResolveLocaleOptions) { ... }
function syncLocaleFiles(options: SyncLocaleFilesOptions) { ... }

// ✓ Shared concept — no function prefix
const cache: Cache = ...
const params: TParams<T> = ...
```

For domain suffixes (`*Entry`, `*Item`, `*Context`, `*Tree`, `*Position`, `*Site`, `*Range`, `*Pattern`, `*Level`, `*Stats`, `*Data`), the prefix is always the concept noun.

**Parameter name and type suffix are paired:**

| Parameter name | Type suffix |
| --- | --- |
| `options` | `*Options` |
| `input` | `*Input` |
| `config` | `*Config` |
| `request` | `*Request` |

### Platform-API mirroring

A parameter or option-field name that mirrors a platform or standard-library key keeps the platform name verbatim, even when it repeats the enclosing function or method name.

```ts
// ✓ `currency` mirrors Intl.NumberFormat's `currency` option
format.currency(value: number, currency: string, options?: Intl.NumberFormatOptions): string;
```

### Function verb prefix vocabulary

Closed list. Every function starts with one of these (or follows a documented exception).

| Prefix | Purpose | Example |
| --- | --- | --- |
| `get*` | Pure getter | `getLocale()` |
| `set*` | Mutator | `setLocale(locale)` |
| `reset*` | Restore state to default | `resetLocale()` |
| `has*` | Boolean check | `hasPlaceholder()` |
| `is*` / `are*` | Boolean state | `isPlainObject()`, `areMessagesEqual(a, b)` |
| `find*` | Search — returns first match or undefined | `findCallSites()` |
| `detect*` | Identify pattern/anomaly in data | `detectRenames()` |
| `format*` | Format a value to a string (Intl-style) | `formatDate()` |
| `stringify*` | Serialize to a string (JSON.stringify-style) | `stringifyCanonical()` |
| `to*` | Convert into another shape | `toDate()` |
| `use*` | React hook | `useLocale()` |
| `parse*` | String → structured value | `parseCookie()` |
| `resolve*` | Compute final value from inputs | `resolveLocale()` |
| `extract*` | Pull a subset out of larger data | `extractMessages()` |
| `transform*` | Map A → B preserving structure | `transformSource()` |
| `remap*` | Rewrite coordinates/positions | `remapPosition()` |
| `strip*` | Remove wrapper/prefix/suffix | `stripCodeFence()` |
| `interpolate*` | Fill template placeholders | `interpolate()` |
| `normalize*` | Bring to canonical form | `normalizeOptions()` |
| `generate*` | Produce derived output (codegen) | `generateConfig()` |
| `discover*` | Scan filesystem/source for items | `discoverLocales()` |
| `migrate*` | Refactor existing data in place | `migrateLocales()` |
| `render*` | Produce display output | `renderTable()` |
| `validate*` | Run validation, may throw | `validateBatch()` |
| `load*` | Async load from disk or network | `loadEnv()` |
| `read*` / `write*` | I/O operations | `readLocaleData()` |
| `create*` | Public factory | `createClient()` |
| `make*` | Private file-scope factory | `makeT()` |
| `define*` | DSL definer for static config | `defineEndpoint()` |
| `auto*` | Automated variant | `autoTranslate()` |
| `with*` | Run callback inside async scope | `withRequest()` |
| `register*` | Add to internal registry | `registerTracker()` |
| `subscribe*` | Observer pattern, returns unsubscribe | `subscribeLocale()` |
| `run*` | Execute registered side effects | `runTrackers()` |
| `pick*` / `omit*` | Subset operations | `pick()` |
| `walk*` | Recursive traversal | `walkSourceFiles()` |
| `build*` | Construct a complex object | `buildOperationTree()` |
| `sync*` | Bring two stores into agreement | `syncLocaleFiles()` |
| `merge*` | Combine entries from source into target | `mergePendingResponseHeaders()` |
| `invalidate*` | Mark cached/derived state as stale | `invalidateData()` |
| `reload*` | Trigger refetch/re-execution of upstream | `reloadModule()` |
| `warn*` | Diagnostic-emitting paired with `warnDiagnostic` | `warnDiagnostic()` |
| `inject*` | Insert generated code into existing source | `injectComponentHooks()` |
| `try*` | Attempt — returns result or `undefined` | `tryBareElision()` |
| `apply*` | Apply a set of changes/patches | `applyPatches()` |
| `collect*` | Gather items into a result set | `collectExports()` |
| `count*` | Tally occurrences | `countReferences()` |
| `emit*` | Produce derived output/diagnostics | `emitPersistenceConfig()` |
| `expand*` | Expand a source into parts | `expandModuleEntries()` |
| `filter*` | Narrow a collection by predicate | `filterAdaptersByFramework()` |
| `interpret*` | Evaluate a parsed structure | `interpretNode()` |
| `mark*` | Tag/annotate tokens in place | `markTaggedTemplates()` |
| `print*` | Write formatted output to a stream | `printHelp()` |
| `scan*` | Sweep source/tokens linearly | `scanToken()` |
| `skip*` | Advance past a span | `skipBalancedBraces()` |
| `sort*` | Order a collection | `sortKeys()` |
| `split*` | Divide into parts | `splitAtDepthZero()` |

#### Getter noun mirrors the return type

- Name a `get*` function's noun after its return type: an object → the type, a collection `T[]` → the plural.

```ts
getEntry(): Entry
getSidebarNodes(): SidebarNode[]
```

#### Composite `*To*` / `*From*` converters

Allowed when both endpoints of the conversion belong in the name:

```ts
blockToText(block): string
rangeFromOffsets(start, end): Range
```

Use the bare `to*`/`from*` prefix when the source value is the function's sole parameter (`toDate(value)`). Use the `*To*`/`*From*` form when there are 2+ parameters (`rangeFromOffsets(start, end)`).

#### Well-known utility verbs

Standard JS/ecosystem utility names are allowed without belonging to the closed list when the name is widely-recognized:

```ts
slugify(text): string       // Lodash, GitHub Pages
debounce(fn, ms): function  // Lodash, RxJS
```

Test: allowed iff the verb is an exported function name in `lodash`, `remeda`, or `rxjs` (verifiable in their published API). Extend the project's verb-prefix list before coining a verb that isn't.

#### Factory-by-name pattern

Functions that return a domain object can use the bare noun-name of what they produce instead of a verb prefix, when the function IS the public constructor for that concept.

```ts
anthropic(options): Translator
openai(options): Translator
cookie(options): Persistence
localStorage(options): Persistence
yapyak(): Plugin
docCompiler(options): Plugin
```

Rule: ONE noun-named factory per concept per package. Multiple variants use `create*` prefixes.

#### CLI command handlers

A function that is a 1:1 handler for a user-typed CLI command carries the command verb directly without a closed-list prefix:

```ts
add()       // yapyak add
check()     // yapyak check
translate() // yapyak translate
```

When the command verb collides with a JS reserved word, suffix with `Command`:

```ts
exportCommand()  // yapyak export
```

Scoped to CLI command files. Internal helpers in CLI code follow the closed list.

#### TUI primitives

Terminal/text-UI primitive functions use the noun-name of the element they make:

```ts
spinner(text): SpinnerController
prompt(question): Promise<string>
progressBar(done, total): string
```

Scoped to TUI helper files.

### Generics

- One type parameter: `T`.
- Two or more: prefix each with `T` and use a descriptive unabbreviated name — `TKey`, `TValue`, `TSource`, `TAccumulator`.
- Never abbreviate (`Acc`, `Src`, `K`, `V`).

```ts
// ✓
type TParams<T extends string> = ...
type ExtractTParams<TSource extends string, TAccumulator = unknown> = ...

// ✗
type ExtractTParams<S extends string, Acc = unknown> = ...
```

### No abbreviations

Use the full domain word. Forbidden: `cfg`, `opts`, `ctx`, `arg`, `req`, `res`, `tmp`, single letters (`e`, `i`, `j`, `k`), filler placeholders (`data`, `info`, `item`, `thing`, `foo`, `bar`).

**Exceptions:**

- `Array.prototype.sort` comparators use `(a, b)` — canonical idiom.
- **`arg` as the element of a real `args` signature.** `arg` is allowed **only** as the element variable of `args` where `args` is the actual function/CLI argument list **declared in a signature** (a `args: string[]` parameter, `process.argv`, a rest parameter). The singular-of-`args` pairing is idiomatic there:

  ```ts
  function findUnknownFlags(args: string[]) {   // `args` is the signature's argument list
    for (const arg of args) { ... }             // ✓ `arg` is one of those arguments
  }
  ```

  The exception binds to **arguments coming from a signature** — not to any local that conceptually relates to "arguments". A variable that merely points *at* an argument (a token index, an AST node, a single extracted value) is **not** a signature argument and expands to `argument`:

  ```ts
  const argumentIndex = findNextSignificant(tokens, next + 1);  // ✗ not a signature arg — it's an index
  const argumentToken = tokens[argumentIndex];                  // ✗ a parsed token, not an arg parameter
  ```

- **Platform-standard terms.** Use the platform's own name for a concept verbatim, even when shorter than the spelled-out word: `dir` (Node — `readdir`, `mkdir`, `dirname`, `__dirname`), `init` (the fetch `RequestInit` argument), `lang` (DOM `documentElement.lang`), `cwd` (`process.cwd()`). The term must be the platform's *own* spelling in its API — a user shortening that appears in no platform API (`cfg`, `opts`, `ctx`) stays forbidden. This is the local-identifier side of [[#platform-api-mirroring]].
- **Reserved or restricted spellings.** When the spelled-out word can't legally be that identifier — a reserved word (`arguments`, `function`, `class`), a global the language or linter forbids shadowing (`constructor`, `eval`, `window`, `globalThis`), or similar — fall back to the established short form or a qualified alternative. `ctor` for a constructor reference (`constructor` shadows `Object.prototype.constructor`); `args` for an `arguments`-style list. The bar is a hard language/linter constraint, never preference — if the full word *is* a legal identifier, use it.

```ts
items.sort((a, b) => a.order - b.order);
```

### Boolean naming

Rule depends on where the boolean lives.

**Three rules:**

1. **Fresh boolean variables** (`useState`, `const`, `let`, function returns) — always carry `is*` / `has*` / `can*` / `should*` / `will*` / `was*` / `are*` prefix.
2. **Object property fields** (interface fields, context values, options, config, props) — NEVER carry that prefix. Bare adjective or verb-phrase.
3. **Crossing the boundary:**
   - Fresh variable → property (assignment INTO an object): alias `{ property: variable }`.
   - Property → local binding (destructuring OUT): keep the bare property name.

```ts
// ✓ Right
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
type ContextValue = { sidebarOpen: boolean; closeSidebar: () => void };
return (
  <Context value={{ sidebarOpen: isSidebarOpen, closeSidebar }}>
);

const { sidebarOpen } = useContext(Context);    // destructure-out, no alias
```

**Exception — pure forward.** A fresh boolean keeps the bare property name (no prefix) when its only references are its initializer and same-key object-property values — a value defaulted from a property and passed straight on under the same key. The prefix is required the moment it is read in a boolean position (an `if` / `while` / ternary condition, `!`, `&&` / `||`, a comparison, or a standalone boolean return).

```ts
// ✓ — defaulted, forwarded under the same key, never tested → bare
const force = options?.force ?? false;
extractStubs({ force, messages }, context);

// ✓ — read in a condition → prefix required
const shouldPreserve = options?.preserve ?? false;
value = shouldPreserve ? previous : '';
```

#### Standalone variables and function returns — required prefixes

| Prefix | Meaning | Example |
| --- | --- | --- |
| `is*` | State / classification | `isLoading` |
| `has*` | Possession / presence | `hasError` |
| `can*` | Ability / permission | `canEdit` |
| `should*` | Recommendation / decision | `shouldRefetch` |
| `will*` | Future state | `willClose` |
| `was*` | Past state | `wasFetched` |
| `are*` | Plural state | `areMessagesEqual` |

#### Object properties — form by meaning

| Category | Form | Examples |
| --- | --- | --- |
| **State** — what the thing *is* | bare adjective / state noun | `disabled`, `selected`, `open`, `hidden`, `loading`, `checked` |
| **Behavior flag** — what `true` *does* | verb phrase | `syncHtmlLang`, `detectUserLocale`, `minify`, `clearScreen` |
| **Artifact emitter** — the noun *is* the output | bare noun | `sourcemap`, `manifest`, `polyfills` |

**Quick test:** "what does `field: true` cause?"

- "The thing *is* X" → state form
- "The system *does* X" → verb form
- "An X is produced" → artifact form

Bare nouns as behavior flags are forbidden. Use a verb phrase: `htmlLang` → `syncHtmlLang`, `acceptLanguage` → `detectUserLocale`.

When a public option flows through internal layers (normalized options, virtual module constants), the same name carries through every layer. Never reintroduce a prefix mid-chain.

### Typed-value fields and parameters

When a field or parameter holds a value of a specific named type, the name is the type name in camelCase.

| Case | Name | Example |
| --- | --- | --- |
| Holds a single named type, no surrounding context carries it | `camelCase(TypeName)` | `attributeNode: AttributeNode` |
| Polymorphic — the type is a union **or** a member of one | the **union** name in `camelCase`; in-domain, drop the domain prefix to the bare last segment | `sidebarNode: SidebarLinkNode`; `node` in a `Sidebar*` scope |
| Collection of one named type | plural of `camelCase(TypeName)` | `attributeNodes: AttributeNode[]` |
| Callable type (`*Fn` / function) | `camelCase(TypeName)` with the trailing `Fn` **removed** | `warn: WarnFn` |

Each row is a string operation on the type name — no judgment. A discriminated-union member takes the **union** name, never its own variant: `SidebarLinkNode` and `SidebarGroupNode` both → `sidebarNode`, identical to the union `SidebarNode`. Callable `WarnFn` → drop `Fn` → `warn`; `ParseFragmentsFn` → `parseFragments`.

**A member names the union, never the member** — `Node` is the base, à la the DOM where a `Text` or `Comment` value is still a `node`.

**Drop the domain prefix only in-domain.** `sidebarNode` collapses to the bare last segment `node` only inside a declaration whose own name carries that domain — a `Sidebar*` type or function (`SidebarDefinition`, `buildSidebar`), including its fields and locals. Outside such a scope the value keeps the full union name.

```ts
// ✓ inside a Sidebar* declaration — prefix dropped
type SidebarDefinition = { node: SidebarNode; label: string };

// ✓ outside the sidebar domain — full union name
type FlatEntry = { sidebarNode: SidebarLinkNode; parentLabel?: string };

// ✗ names the variant, not the union
type FlatEntry = { linkNode: SidebarLinkNode; parentLabel?: string };
```

Qualify a member only to break a real collision — when 2+ members of one union share a scope, prefix each by its distinguishing segment: `linkNode`, `groupNode`.

**Context-carry exception.** When a function operates on a single named type, the function name carries the full type name; the parameter drops to the generic noun from the type's last PascalCase segment:

| Type | Function name shape | Parameter name |
| --- | --- | --- |
| `AttributeNode` | `[verb]AttributeNode` | `node` |
| `CallSite` | `[verb]CallSite` | `site` |
| `MessageContext` | `[verb]MessageContext` | `context` |

```ts
// ✓
function handleAttributeNode(node: AttributeNode): void { ... }
function resolveCallSite(site: CallSite): ResolvedSite { ... }
```

**Callable types drop `Fn`.** A value held in a **named** `*Fn` type is `camelCase(TypeName)` minus the trailing `Fn`: `WarnFn` → `warn`, `ParseFragmentsFn` → `parseFragments` — never `warnFn` (the `Fn` marks the *type*, not the value). A **roleless generic** function — the wrapped callback in a `memoize`/`once`-style helper, `(...) => T` with no concept — defaults to `callback`; use `fn` only when `callback` already names another binding in scope. `function` is a reserved word, so the short form `fn` is the [[#no-abbreviations]] reserved-spelling exception. That exception is what makes `fn` legal and nothing else: a generic string/number/object value names its type **in full** (`string`, `number`, `object`, `value`), never `str`/`num`/`obj`, because those words are legal identifiers.

### Union member types carry the union's category suffix

- Give every named member of a category union the union's suffix: a `*Node` union's members are `*Node`, a `*Block` union's are `*Block`. (A `*Config` union is the strategy-union exception — its variants take `*Options`.)

```ts
// ✓
type SidebarNode = SidebarGroupNode | SidebarLinkNode;

// ✗ members drop the category the union asserts
type SidebarNode = SidebarGroup | SidebarLink;
```

### Discriminator fields — `type` vs `kind`

The discriminator field of a tagged union is named by a single mechanical rule. No judgment.

> **The field is `type` iff its type is reachable from a *public* export of a package that is NOT `"private": true`. Every other discriminator field is `kind`.**

A public export is any `exports` entry except an `/internal` subpath (`./internal`, `./compiler/internal`, …) — library-internal plumbing, not the external surface. Apply to the package that declares the field:

1. Open the declaring package's `package.json`. Is `"private": true`? → **`kind`**. Done.
2. Else: is the type re-exported (transitively) from any public export — the `.` entry **or any non-`/internal` subpath** (`./config`, `./processor`, `./adapter`, …)? **Yes → `type`. No (only via an `/internal` subpath, or unexported) → `kind`.**

`type` is the ecosystem's public tag (Redux, config, `node.type`); `kind` is the compiler's internal one (`SyntaxKind`, AST nodes, private output), and dodges the `type`-keyword collision in traversal code.

| Type | Package | Reachable from a public export? | Field |
|---|---|---|---|
| `RichTextNode` | `yapyak` (published) | yes — `.` | `type` |
| `PersistenceConfig` | `yapyak` (published) | yes — `./config` | `type` |
| `ProcessorFragment` | `yapyak` (published) | yes — `./processor` | `type` |
| `TemplateNode` | `yapyak` (published) | no — only `./compiler/internal` | `kind` |
| anything in `@yapyak/docs-compiler` | private | — | `kind` |
| anything in `@yapyak/docs` | private | — | `kind` |

The discriminator **type name** (when named) matches the field: field `type` ↔ `*Type` (per the § Forbidden suffixes exception); field `kind` ↔ `*Kind`. The discriminator **values** are kebab-case regardless (next section).

A type has exactly one home package and one public/internal status, so its field name is fixed at declaration — it never changes based on where it is used.

**Lineage exception — a derived form inherits its source's name.** A normalized, resolved, or remapped form of another *typed* union keeps that union's discriminator name, even behind an `/internal` subpath — decided once at the first typed origin, never flipped along a transform chain. A union built fresh from untyped input (raw text) is *original*, and takes the base rule.

```ts
// PersistenceConfig is public → `type`.
type PersistenceConfig = { type: 'cookie'; ... } | { type: 'url'; ... } | ...;

// NormalizedPersistenceConfig is the normalized form of PersistenceConfig.
// It lives only in ./config/internal — but it INHERITS `type`. Never `type`→`kind`.
type NormalizedPersistenceConfig = { type: 'cookie'; ... } | { type: 'url'; ... };
```

**Upstream-mirror exception.** A type that declares the shape of an external library's runtime value mirrors that library's discriminator field name — yapyak does not own the shape and cannot rename a field the object carries. See [[#platform-api-mirroring]].

```ts
// @astrojs/compiler tags nodes `type` — mirror it, regardless of visibility
type AstroRoot = { type: 'AstroRoot'; children: BodyNode[] };
```

**Collision exception — the discriminator keeps the canonical name.** When the assigned name (`type`/`kind`) already exists as a *secondary* field, the discriminator keeps it; the secondary becomes `<noun>Kind`/`<noun>Type`. A variant never carries two `kind` (or two `type`) fields.

```ts
// ✗ Collision — Block is private → discriminator `kind`, but a secondary `kind` already exists
type LinkBlock = { kind: 'link'; kind: 'external' | 'internal'; href: string };

// ✓ Discriminator keeps `kind`; the secondary becomes `linkKind`
type LinkBlock = { kind: 'link'; linkKind: 'external' | 'internal'; href: string };
```

A secondary `type` beside a `kind` discriminator is renamed the same way: `type: 'cardinal' | 'ordinal'` beside `kind: 'plural'` → `pluralKind`.

### String-literal values

String literals used as discriminator tags, enum-like values, or domain identifiers use **kebab-case**.

```ts
// ✓
type Persistence = 'cookie' | 'local-storage' | 'url' | null;
type Mode = 'serve' | 'build' | 'preview';
{ severity: 'warn-once' }
{ kind: 'template-expression' }

// ✗
type Persistence = 'cookie' | 'localStorage' | 'url' | null;
{ severity: 'Warning' }
```

**Exception — match the external identifier exactly:** when the literal must equal a name from outside the codebase, preserve the external spelling.

```ts
// ✓ — actual React function names
const HOC_NAMES = new Set(['forwardRef', 'lazy', 'memo', 'observer']);

// ✓ — HTTP header schemes
{ scheme: 'Bearer' }

// ✓ — DOM event name
element.addEventListener('DOMContentLoaded', ...);
```

### Regex naming

Regex literals stored in named bindings carry an `_RX` / `Rx` suffix.

| Context | Form | Example |
|---|---|---|
| Top-level constant | `UPPER_SNAKE_RX` | `EMAIL_RX`, `SLUG_RX` |
| Local variable | `camelCaseRx` | `const slugRx = /^[a-z]+$/;` |

Mandatory for any binding whose value is a `RegExp`. Inline regex (used once, not assigned) needs no suffix.

```ts
// ✓
const SLUG_RX = /^[a-z0-9-]+$/;
if (/^\d+$/.test(value)) { ... }
```

### Map and Set naming

**Set** — always a plural noun describing the elements: `listeners`, `trackers`, `seen`, `aliases`.

**Map** — pick by purpose:

| Purpose | Pattern | Example |
| --- | --- | --- |
| Index/lookup (key derived from value) | `<plural-values>By<KeyName>` | `messagesByFile`, `usersById` |
| Cache/memoization (input → derived) | `<thing>Cache` | `pluralRulesCache` |
| Domain mapping (the map *is* a concept) | Plural noun for contents | `branches`, `variants` |

**Forbidden** — bare type-nouns or generic names:

```ts
const set = new Set();       // ✗
const map = new Map();       // ✗
const data = {};             // ✗
const result = new Map();    // ✗
```
