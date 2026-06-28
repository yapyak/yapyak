## Naming

Files, folders, symbols, suffixes, verbs, booleans — closed vocabularies.

### Files and folders

- All files and folders use `kebab-case`. No exceptions.
- Filename matches primary export by spelling, not casing: `createIntl` → `create-intl.tsx`, `useLocale` → `use-locale.ts`.
- When only one of a kind exists in a module, drop qualifiers: `vite/parser.ts`, not `vite/vite-parser.ts`.

### Mechanical filename derivation

Filename derives from the primary export through a deterministic algorithm. No closed list of verbs to maintain.

```
ALGORITHM:
  1. Kebab-case the primary export name.
  2. Drop the FIRST segment (the verb — always, no list lookup).
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

Modifiers describe position/quantity/relation. They are NOT subtypes. `internal` (subtype) is kept; `first` (position) is dropped.

**Singularize rules:**

- Trailing `s` → drop (`pages` → `page`)
- Trailing `ies` → `y` (`entries` → `entry`)
- Trailing `es` after sibilants → drop `es` (`boxes` → `box`)
- Irregulars per the closed list

**Worked examples:**

| Export | Trace | Filename |
| --- | --- | --- |
| `getSidebar` | drop `get` → Sidebar | `sidebar.ts` |
| `getAllPages` | drop `get` → AllPages → drop `all` → Pages → Page | `page.ts` |
| `getInternalLinks` | drop `get` → InternalLinks → InternalLink | `internal-link.ts` |
| `walkSourceFiles` | drop `walk` → SourceFiles → SourceFile | `source-file.ts` |
| `wrapWithProgress` | drop `wrap` → WithProgress → drop `with` → Progress | `progress.ts` |
| `migrateLocales` | drop `migrate` → Locales → Locale | `locale.ts` |
| `toMessageId` | drop `to` → MessageId | `message-id.ts` |
| `createIntl` | drop `create` → Intl | `intl.tsx` |
| `interpolate` | drop `interpolate` → empty → fall back | `interpolate.ts` |
| `t` | drop `t` → empty → fall back | `t.ts` |

### Folder threshold

```
Create folder X iff 2+ files in the same parent would resolve to the same name.
```

The algorithm naturally drives this — when two files compute to the same name, create a folder named after the shared concept. The parent-strip step shortens inner filenames.

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

Folders and files are always singular. Plural is allowed only for collection variables.

```ts
const locale = 'sv';
const locales = ['en', 'sv'];

cookie.ts, locale.ts, endpoint.ts       // singular files
adapter/, locale/, runtime/             // singular folders
cli/command/, route/, fixture/          // singular folders (peer instances)
```

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

`type.ts` is always singular. `types.ts` is banned.

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

**Step 2 — no role applies → plural form of the contained thing:**

```ts
type LocaleTranslations = Record<string, string>;
type Variants = Record<string, string | Template>;
```

`*Dict` is banned.

### `utils/` and `helpers/` — banned

| Situation | Correct response |
| --- | --- |
| 1 utility, 1 consumer | Inline at consumer |
| 1 utility, 2+ consumers | Concept-named file (`pluralize.ts`) |
| Multiple unrelated utilities | Split into concept files |
| Multiple tightly-related utilities | Merge into concept file (`string-format.ts`) |

App code does not get an exception.

### Type suffix vocabulary

Closed list. Extend before coining.

| Suffix | Meaning | Example |
| --- | --- | --- |
| `*Options` | Pure object bundle of fields, used as input. Paired with `options` parameter. | `CookieOptions` |
| `*Input` | Bundle of inputs to an internal helper. Paired with `input`. | `ApplyOrphanMutationsInput` |
| `*Config` | User configuration. Disk-loaded file shape OR a union with strategy shortcuts. Paired with `config`. | `YapyakConfig`, `PersistenceConfig` |
| `*Result` | Return value of a non-trivial action/computation | `ExtractFileResult` |
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
| `*Props` | React component props | `IntlProviderProps` |
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
| Q5 | Is the type the return value of a non-trivial action/computation function? | `*Result` |
| Q6 | Is the type the return value of a React hook? | `*Return` |
| Q7 | Is the type a callable/function type? | `*Fn` |
| Q8 | Is the type a function's parameters tuple? | `*Params` |
| Q9 | Is the type React component props? | `*Props` |
| Q10 | Is the type a pure object bundle, used as input to an internal helper with `input` parameter? | `*Input` |
| Q11 | Is the type a pure object bundle (any other input/options use)? | `*Options` |

**Intuition:**

- `*Config` = user **picks** (file shape or strategy union)
- `*Options` = user **fills in** (typed bag of fields)
- `*Input` = **internal helper** takes a structured bundle (parameter literally named `input`)

**Field optionality is NOT part of the test.** A `*Options` type may have required fields, optional fields, or both. The suffix is decided by call-site role, not by counting `?` markers.

```ts
// ✓ — public factory with required field. Q11 → *Options.
type AnthropicOptions = {
  apiKey: string;
  model?: string;
};
export function anthropic(options: AnthropicOptions): Translator { ... }

// ✓ — internal helper. Q10 → *Input.
type ExtractFileInput = {
  fileId: string;
  source: string;
  processors: Processor[];
};
function extractFile(input: ExtractFileInput): ExtractFileResult { ... }
```

**Forbidden reasoning:**

- ❌ "This `*Options` type has a required field → must be `*Input`." Wrong — Q11 does not ask about optionality.
- ❌ "All-optional bundles must be `*Options`, anything else `*Input`." Wrong — same reason.

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
| `NormalizedPersistenceConfig` | `normalizedPersistenceConfig` (or `persistenceConfig` if context disambiguates) | `PERSISTENCE_CONFIG` |
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

| Banned suffix | Why |
| --- | --- |
| `*Instance` | Every type is implicitly an instance |
| `*Object` | Vacuous |
| `*Type` | Meta-jargon — the thing is already a type |
| `*Class` | Meta-jargon |
| `*Interface` | Meta-jargon |
| `*Impl` / `*Implementation` | The implementation IS the type |

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

#### Composite `*To*` / `*From*` converters

Allowed when both endpoints of the conversion belong in the name:

```ts
blockToText(block): string
rangeFromOffsets(start, end): Range
```

Avoid for simple conversions where the source is obvious — `toDate(value)` beats `valueToDate(value)`.

#### Well-known utility verbs

Standard JS/ecosystem utility names are allowed without belonging to the closed list when the name is widely-recognized:

```ts
slugify(text): string       // Lodash, GitHub Pages
debounce(fn, ms): function  // Lodash, RxJS
```

Test: would a TypeScript developer recognize this verb from `lodash`, `remeda`, `rxjs`? If yes — allowed.

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

**Exception:** `Array.prototype.sort` comparators use `(a, b)` — canonical idiom.

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
| Holds a single named type, no surrounding context carries it | type name in camelCase | `attributeNode: AttributeNode` |
| Polymorphic (union of node kinds) | generic concept noun | `node: AstNode` |
| Collection of one named type | plural of type name | `attributeNodes: AttributeNode[]` |

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
