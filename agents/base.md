## Base

### Multi-target options — nested per-target objects

When a function configures multiple output targets or sub-systems, expose per-target options as **inline nested objects keyed by target name**. Cross-cutting options stay at the top level. Never duplicate cross-cutting options inside every nested target.

```ts
// ✓ Right — per-target inline, cross-cutting at top
type BuildOptions = {
  outDir: string;                  // cross-cutting
  sourcemap: boolean;              // cross-cutting
  esm?: { entry: string; minify?: boolean };
  cjs?: { entry: string };
  iife?: { entry: string; name: string };
};

// ✗ Wrong — cross-cutting duplicated inside each target
type BuildOptions = {
  esm?: { entry: string; outDir: string; sourcemap: boolean; minify?: boolean };
  cjs?: { entry: string; outDir: string; sourcemap: boolean };
};
```

### Modules

- **Named exports only.** Never `export default`.
- One concept per file.
- `index.ts` re-exports the public API of a folder/module.

### Always use `type`, never `interface`

Every type declaration uses `type` — object shapes, unions, mapped types, conditional types, everything. `interface` is forbidden.

```ts
// ✓ — object shape
type Options = { include: string[]; exclude: string[] };

// ✓ — union
type ContextLevel = 'none' | 'minimal' | 'rich';

// ✓ — alias for non-object
type LocaleFile = Record<string, Record<string, string>>;

// ✓ — mapped/conditional
type ExtractParams<T extends string> = T extends `${string}{${infer P}}${string}` ? P : never;

// ✗ — interface
interface Options { include: string[]; exclude: string[]; }
```

Enforced by biome's `useConsistentTypeDefinitions` with `style: "type"`. Discriminated unions:

```ts
type TextBlock = { kind: 'text'; value: string };
type HeadingBlock = { kind: 'heading'; depth: 1 | 2 | 3; text: string };
type Block = TextBlock | HeadingBlock;
```

Why: a single consistent syntax across the codebase, no judgment calls about when to switch forms, and no surprises from declaration-merging.

#### Exception: declaration-merging augmentation slots

`type` doesn't support declaration merging. The single legitimate use of `interface` is a public augmentation slot that consumers extend through `declare module`. Mark it with the biome-ignore comments.

```ts
// biome-ignore lint/style/useConsistentTypeDefinitions: declaration merging
// biome-ignore lint/suspicious/noEmptyInterface: declaration merging
export interface Register {}

export type Locale = Register extends { Locale: infer L extends string }
  ? L
  : string;
```

The consumer narrows the public surface from their own `.d.ts`:

```ts
declare module 'yapyak' {
  interface Register {
    Locale: 'en' | 'sv' | 'da';
  }
}
```

This is the only place `interface` is allowed. If you reach for declaration merging for any other reason, find a different design.

### Code organization — splitting into files

**Each file owns one concept.** A concept = an exported symbol (function, type, class, constant) plus its tightly-coupled private helpers.

**File naming follows the primary export.** `parse-cookie.ts` exports `parseCookie`. `extract-params.ts` exports `extractParams`. Helper functions inside don't drive the filename.

#### Mechanical extraction rule

A symbol (function, type, constant) lives in its own file when ANY of these is true. Otherwise, **inline** it in its sole consumer.

| Test | Action |
| --- | --- |
| Imported by **2+ files** | Own file |
| In a **public/internal barrel** (`index.ts`, `internal.ts`) | Own file |
| Has its own **`.test.ts` file** | Own file |
| **Peer-instance pattern** — one of N discrete siblings in a peer-folder (`commands/`, `persistence/`, `processor/`) | Own file |

If a standalone file currently has **exactly 1 consumer** and no exception applies, **move it into the consumer and delete the file**. YAGNI applied to file structure — don't pre-emptively extract "for future reuse"; extract when the second consumer arrives.

**Types follow the same logic.** Used by 1 file → declare as non-exported `interface`/`type` locally. Used by 2+ → exported from shared location (own file, types-bag, or barrel).

#### File size is never a trigger

These justifications are **forbidden** when proposing a split. The 4-trigger table is the WHOLE rule.

| Forbidden justification | Why it's wrong |
|---|---|
| "File is large (500+ LOC)" | Size measures volume, not coupling. Tightly-coupled code stays together. |
| "Functions are conceptually distinct" | Single-consumer = inline, even when conceptually separable. |
| "Splitting improves organization" | The 4-trigger table IS the organization rule. |
| "Cognitive load reading top-to-bottom" | Editor folding solves this without files. |
| "It's the biggest file in the package" | Size ranking is not a trigger. |
| "Each helper deserves its own home" | Single-consumer helpers belong in their consumer. |
| "Adding test coverage requires extraction" | Test the public API. Sub-functions are covered by integration tests. |

#### Coherent module — when 700+ LOC is correct

A file is a coherent module — stays together regardless of size — when **ALL** of these hold:

1. **One public entry point.** A single exported function (or small public API) drives all other symbols.
2. **Shared data shape.** Sub-functions operate on the same input/output types (request, callSite, state, etc.).
3. **No external consumers of helpers.** Every non-exported function is single-consumer.
4. **Top-to-bottom is the natural reading order.** Sub-functions are best understood in sequence with the entry.

When all four hold, splitting creates artificial seams and import noise without any rule justifying it.

#### Mandatory pre-split checklist

Before proposing any file split, run this explicitly. Skipping it means proposing pattern-matched refactor instead of rule-following:

1. **List every symbol you plan to extract.** Write them down.
2. **For each, count triggers** from the 4-trigger table (2+ consumers, in barrel, has `.test.ts`, peer-instance).
3. **If every candidate has 0 triggers** → the split is forbidden. Stop.
4. **If your justification appears in the "forbidden justifications" table** → the split is forbidden. Stop.
5. **If the file is a coherent module per the 4 conditions above** → the split is forbidden. Stop.

Splitting is allowed only when at least one candidate has 1+ trigger AND none of the forbidden justifications drives the proposal.

#### `utils/` is a smell, not a pattern

Avoid `utils/` folders. "Utility" describes "filer som inte hittade hem", not a shared concept. Prefer:

- **Inline** when there's a single consumer
- **Top-level `src/<noun>.ts`** for genuinely generic helpers (slug, debounce-like) with 2+ consumers and no domain home
- **Domain folder** when the helper belongs to an existing concept

`utils/` is justified only when you have 3+ helpers that genuinely share a concept (and then a more descriptive folder name is usually better — `string-utils/`, `path-utils/`).

### Code organization — splitting into folders (modules)

**A folder exists when at least one is true:**

1. **2+ files share a concept** — the folder name describes the shared concept.
2. **The folder is a public subpath** — exposed via `package.json` `exports`, even with one file inside.

**A folder always has an `index.ts` (barrel)** that re-exports the folder's public surface. Cross-folder imports go through the barrel — see [[imports]] for the library exception and the `#alias/*` apps convention.

**Single-file concepts don't get folders.** A standalone `parser.ts` stays a file until a second file (`parser-utils.ts`, `parser-errors.ts`) joins it — then both move into `parser/` with a barrel.

**Folder names are singular and describe the concept** — `adapter/`, `locale/`, `runtime/`, `translator/`. Never plural unless it's a peer-item dictionary folder (`cli/commands/`).

**When to split a folder into sub-folders:**

- 5+ files AND they fall into clear sub-concepts → sub-folder per sub-concept.
- Otherwise, stay flat. Premature nesting is worse than a flat folder with many siblings.

### Decision flow when writing new code

1. **New exportable symbol** → put it in a file matching its name (kebab-case primary export).
2. **Does an existing folder fit the concept?** → yes, add the file there. If the symbol is consumed from outside the folder, add it to the folder's `index.ts` barrel.
3. **No existing folder fits, but a single new file is enough** → put the file at the appropriate level. Don't create a folder yet.
4. **Multiple new files share a new concept** → create the folder + `index.ts` barrel. Move siblings in if they belong.

### File layout

Order inside every `.ts` / `.tsx` file:

1. Imports (formatter-controlled).
2. Exported types.
3. Exported constants.
4. Exported function(s) — the file's primary export first.
5. Helper functions — below the primary export, in order of first usage.
6. Module-scope constants used only by helpers — directly above the helper that uses them.

Helpers never appear above the exported function they support.

### Object shapes — `interface` by default

All object shapes use `interface`, **unless** the project overrides this via Biome's `useConsistentTypeDefinitions: type`. Always check the project's `biome.json` (or equivalent) first — when the linter enforces `type`, follow that.

```ts
// ✓ Right — default
export interface AutoScrollerOptions {
  threshold: number;
  velocity: number;
}

// ✗ Wrong — plain shape as type alias (default rule)
export type AutoScrollerOptions = {
  threshold: number;
  velocity: number;
};
```

**Exception:** Use `type` when the shape cannot be expressed as a plain interface:

| Scenario | Example |
| --- | --- |
| Derived via utility types | `type NormalizedOptions = Required<YapyakOptions>` |
| Discriminated union | `type Persistence = CookiePersistence \| LocalStoragePersistence` |
| Function-call signature as the entire type | `type Handler = (x: T) => U` |
| Mapped or conditional type | `type Loose<T> = Partial<T>` |

### Union types — inline on the field vs named

Before deciding how variants render, decide whether the **union itself** deserves a name. A union/object type that's only ever referenced from a single public field is not a concept — it's a field shape. Inline it.

**Inline the entire union on the field when ALL hold:**

1. Referenced from **exactly one** location in the public surface (one field, no reuse).
2. Consumers have no realistic need to derive variants via `Extract<>` / `Pick<>` against the name.
3. No natural name exists. If you're bikeshedding between `*Options` / `*Config` / `*` / `*Backend`, the type isn't a concept — it's a field shape.

**Otherwise extract a named type.**

```ts
// ✓ Inline — single-use field shape, no consumer derivation, no natural name
export interface YapyakOptions {
  /**
   * Where to persist the user's locale selection.
   *
   * @example
   * ```ts
   * persistence: 'cookie'
   * persistence: { type: 'cookie', name: 'app:locale' }
   * ```
   */
  persistence?:
    | 'cookie'
    | 'localStorage'
    | { name?: string; type: 'cookie' }
    | { key?: string; type: 'localStorage' }
    | null;
}

// ✗ Wrong — extracting a name no one needs, then bikeshedding the suffix
export type PersistenceOptions = /* ... */;
export interface YapyakOptions {
  persistence?: PersistenceOptions | null;
}
```

If a private helper inside the same file needs the union type, reference it via `YapyakOptions['persistence']` — don't reintroduce a named alias.

```ts
function normalizePersistence(
  input: YapyakOptions['persistence'],
): NormalizedPersistence { /* ... */ }
```

### Union variants — inline vs named

For tagged-union variants, apply this test. **Inline the variant shape when BOTH hold:**

1. Variant is used in exactly **one** union — no reuse.
2. Variant has **no top-level JSDoc** — only field-level descriptions, no prose explaining what the variant IS as a concept.

**Otherwise extract as a named type.**

Field count is **not** a test. A 7-field variant inlines fine as a multi-line object literal.

```ts
// ✓ Inline — simple variants, single consumer
export type PersistenceOptions =
  | 'cookie'
  | 'localStorage'
  | { type: 'cookie'; name?: string }
  | { type: 'localStorage'; key?: string };

// ✓ Inline (multi-line) — still inline-able with many fields, if single-use and no top-level JSDoc
export type CookieOption =
  | {
      type: 'cookie';
      name?: string;
      maxAge?: number;
      sameSite?: 'lax' | 'strict' | 'none';
      domain?: string;
      secure?: boolean;
      httpOnly?: boolean;
    }
  | { type: 'localStorage'; key?: string };

// ✓ Named — variant is reused OR has top-level JSDoc explaining what it IS
export type ButtonAtomicProps = { /* used by Button AND ButtonGroup */ };
export type ButtonContainerProps = { /* "Container variant — renders children as structural slots." */ };
export type ButtonProps = ButtonAtomicProps | ButtonContainerProps;
```

Consumers who need to derive a variant type can do so:
`type CookieVariant = Extract<PersistenceOptions, { type: 'cookie' }>`.

### Union vs optional field — additive variants forbidden as union

A discriminated union exists to model **semantically distinct shapes**: different required fields, different field types, mutual exclusion. When the only difference between two variants is that **one carries strictly more fields than the other** (purely additive — no field renamed, removed, retyped, or mutually excluded), a union is the wrong tool. Use a **single object type with optional fields**.

**Mechanical test.** Given two object variants `A` and `B` in a union, is the field set of `A` a proper subset of the field set of `B`, with every shared field carrying the same type?

| Result | Action |
| --- | --- |
| Yes — A is a strict subset of B (purely additive) | Collapse into one type with optional fields |
| No — A and B differ in shape, type, or required combinations | Keep the discriminated union |

```ts
// ✗ Wrong — additive variants masquerading as a union
runtime?:
  | { module: string }
  | { invoke: string; module: string };

// ✓ Right — single type, optional field
runtime?: {
  invoke?: string;
  module: string;
};

// ✓ Right — discriminated union; variants have distinct shapes (different fields, different types)
type Persistence =
  | { type: 'cookie'; name?: string; maxAge?: number }
  | { type: 'local-storage'; key?: string }
  | { type: 'url'; match?: RegExp };
```

**Why the optional field wins for additive cases:**

- TS narrowing works identically: `value.field !== undefined` narrows the field to its non-undefined type.
- Single-shape mental model matches "this field may or may not be present" — what the data actually means.
- Avoids cargo-culting `'field' in value` discriminators where the discriminator is just the presence of an optional field.

**Why discriminated union still wins for distinct shapes:**

- TS enforces mutual exclusion (the `cookie` variant can't carry `key`).
- The `type` tag drives exhaustive `switch` statements with compile-time completeness checks.
- Variants legitimately diverge in field requirements (`maxAge` only makes sense for cookies).

A purely-additive union has none of these benefits — it just adds noise.

### Cross-module imports

Cross-module imports follow [[imports]].

### Test files

- Unit tests: `*.test.ts` co-located next to implementation.
- Type-only tests (`expectType<T>`): `*.test-d.ts`.
- One test file per implementation file. Never a `tests/` folder.

### Language rules

- Never use the `readonly` modifier. Not in interfaces, not in array types, not on class properties. `ReadonlyMap<K, V>` and `ReadonlySet<T>` are also forbidden — use `Map<K, V>` and `Set<T>`.
- Never use the generic forms `Array<T>` and `ReadonlyArray<T>`. Use the bracket form `T[]`. For unions and function types, wrap in parens: `(string | RegExp)[]`, `(() => void)[]`.
- Never use `as unknown as` to make code compile. Fix the type instead.
- Never use `as` to narrow to a literal union — write a narrowing function (`is*` typeguard) instead.
- Always use braces and a newline for `if`-statements. No one-line form.
- One property per line in object literals. Exceptions: well-known patterns like `{ sync: true }`, `{ timeout: 3000 }`.
- Never use `.then()` chains. Always `async`/`await`.
- The `_` prefix is allowed in these cases only:

  1. **Reserved-word escape** — when the plain name is a reserved word (`_type` because `type` is not reserved; `_enum` because `enum` is reserved).
  2. **Compiler-emitted runtime helpers** — names user code never types directly (e.g. `_pick` emitted by a `$t()` rewrite, matching the industry convention of React's `_jsx`, Vue's `_createBlock`, Lingui's `_i`).
  3. **Intentionally-unused function parameters** — when the parameter's position is fixed by an enclosing callback or function-type signature and the body doesn't reference it. The leading `_` signals "shape required, value unused" and satisfies Biome's `noUnusedFunctionParameters` rule.

  Never use `_` as a "private" marker on hand-written user code.
- Never nest ternaries. Max one `?:` per expression. Extract anything more into a `get*` helper with a `switch`.

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
```

`T | null` is reserved for genuine **not-found lookups** (`findEntry`, `pickTranslator`, `parseDate`) and **input-driven absences** (`createPersistence(null)` returns `null` because the config said so). Never for "I had nothing to do".

### Never re-declare upstream types

If an upstream package (`vite`, `react`, `@tanstack/react-router`, `zod`, etc.) exports a type, **import their version**. Never re-declare it locally.

```ts
// ✗ Wrong — duplicates Vite's own type
export type FilterPattern = string | RegExp | Array<string | RegExp> | null;

// ✓ Right — import from upstream
import type { FilterPattern } from 'vite';
```

**Exception:** rare cases:
- The upstream type is too loose and you need a stricter subset (use `Extract<...>` or a branded type, not a re-declaration).
- You're explicitly intercepting/overriding for a compatibility shim (document why with a comment — one of the rare cases where a comment is justified).

### Defaults

Two rules — one for call sites, one for API design.

**Never pass a value that equals the default.** If an option, prop, or parameter has a default, omit it at the call site when you're passing that exact default. Defaults exist so callers can omit them.

```ts
// ✗ Redundant — these literals match the defaults
<Button disabled={false} />
tsup({ minify: false, splitting: undefined })
useState<boolean>(false)              // (when called with no arg already)
new Set<string>([])                   // empty array is the default

// ✓ Keep the prop when the value is a variable
<Button disabled={isDisabled} />      // value unknown at write-time

// ✓ Non-default value — explicit
<Button disabled />                   // shorthand for {true}, non-default
tsup({ minify: true })
```

The rule applies to JSX props, function arguments, object literals, and class instantiation.

**Boolean options in our own APIs default to `false`.** Always. Opt-in semantics — features must be explicitly enabled. This governs the polarity of the default once the option exists; whether to add the option at all is governed by [[working-with-user]] § Defaults and optional parameters.

```ts
// ✓ Right — opt-in, default false (verb-phrase behavior flags per Boolean naming)
interface NormalizerOptions {
  dedupe?: boolean;       // false by default
  stripNulls?: boolean;   // false by default
  freeze?: boolean;       // false by default
}

// ✗ Wrong — defaulting to true, opt-out semantics
interface NormalizerOptions {
  dedupe?: boolean;   // ?? true — forbidden
}
```

If a feature feels like it "should" be on by default, that's a sign the feature should be unconditional (always on, no flag) — not a boolean opt-out. Use opt-in OR no flag, never opt-out.

### Argument shape — positional vs options

Mechanical rule, no judgement calls. The rule has four mechanical layers — each layer's test is a yes/no question with no interpretation room.

#### The default rule

1. **Required arguments → positional**, in conceptual order.
2. **Optional arguments → fields in a single trailing `options` object**.

A required value never lives in an `options` object — `options` semantically implies choice, and choice implies optionality.

#### Suffix mechanics (extends [[naming]] § Type suffix vocabulary)

The suffix you pick on an object-parameter type is binding. The rule is mechanical:

| Suffix on the parameter type | Required fields allowed? | Semantics |
| --- | --- | --- |
| `*Options` | **No.** All fields must be optional. | "Tweak knobs you can set." Picking this name commits to optionality. |
| `*Input` | Yes | "Operation-specific inputs going IN." |
| `*Request` | Yes | "Complete operation request." |
| `*Context` | Yes | "Persistent flow state — bundled domain context." |
| `*Config` | Yes | "User-declared configuration." |

If a bundle has required fields, name it `*Input` / `*Request` / `*Context` / `*Config` — not `*Options`. The suffix IS the mechanism.

**Mechanical test:** Look at the parameter's type name suffix. Look at its fields. If suffix is `*Options` and any field is required → violation.

#### Bundling test — when `*Input`/`*Request`/`*Context`/`*Config` is allowed

Required fields MAY be bundled into a `*Input`/`*Request`/`*Context`/`*Config` type only when MECHANICALLY justified. Two yes/no tests — at least one must hold:

1. **Forced**: Splitting would result in **5+ required positional arguments**. The hard cap forces bundling.
2. **Shared**: The bundle type is consumed by **2+ functions** — it's a real cross-cutting domain concept (e.g. `LocaleContext`, `PackageContext`).

**Neither holds → bundling is forbidden.** Required fields go positional, optional fields go in a `*Options` object.

**Mechanical procedure:**
1. Count what the positional-arg-count would be if you split (required fields + any other positional args like a universal `projectRoot`).
2. Count the consumers of the proposed bundle type.
3. Bundle iff (count from step 1 ≥ 5) OR (count from step 2 ≥ 2).

**Worked decision examples:**

| Function | Required count if split | Bundle consumers | Bundle allowed? |
| --- | --- | --- | --- |
| `migrateLocales` | 3 (input) + LocaleContext + projectRoot = 5+ | n/a | ✅ Forced (5+ positional) |
| `autoTranslate` | 2 (input) + LocaleContext + projectRoot = 4 | LocaleContext used by 4 | ✅ Shared |
| `createTranslator` (1 req + 4 opt) | 1 | 1 | ❌ Must split: `createTranslator(translate, options?)` |
| `createProcessor` (4 req) | 4 | 1 | ❌ Must split: `createProcessor(applyImport, extensions, id, parseFragments)` |
| `walkSourceFiles` (2 req) | 2 | 1 | ❌ Must split: `walkSourceFiles(filter, projectRoot)` |
| `buildSymbolPage` (8 req fields) | 8+ | 1 | ✅ Forced (hits cap) |

**Why this is non-negotiable:** Without this test, the choice between `*Input` and positional becomes a judgment call. The whole rule then has a soft hole. The bundling test eliminates the judgment by tying bundling to **measurable code structure** (positional count, consumer count).

#### Exception A — Extending an upstream/platform API

When `class Foo extends UpstreamClass` (or implementing an upstream interface/signature), match upstream's signature exactly. You may **add fields to upstream's `options` object — including required ones** — but you may **not add new positional arguments**.

```ts
// ✓ Right — extends Error; Error's signature is (message, options).
// `code` is a required addition; it goes in options because positional is locked.
class YapyakError extends Error {
  constructor(
    message: string,
    options: { code: string; cause?: unknown; meta?: Record<string, unknown> },
  ) { ... }
}

// ✗ Wrong — invented a third positional, breaking the upstream signature.
class YapyakError extends Error {
  constructor(
    message: string,
    code: string,
    options?: { cause?: unknown },
  ) { ... }
}
```

**Mechanical test:** Does the class have an `extends` clause that points to an upstream/platform type, OR does the signature implement a documented upstream interface? Yes → exception applies. No → default rule applies.

#### Exception B — Factory pattern

When a function follows the factory pattern — either **factory-by-name** (named after the domain object it produces — see [[naming]] § Factory-by-name pattern) or uses the **`create*` verb prefix** — required fields MAY live in its bundle parameter. SDK convention dominates: `openai({ apiKey })`, `cookie({ name })`, `createTranslator({ translate })`, `createProcessor({ id, extensions })` read naturally as "set up X with these properties".

The bundle suffix follows the suffix selection table:

- Factory-by-name with **no required fields** → `*Options` (paired with `options` parameter; matches `OpenaiOptions`, `CookieOptions` precedents).
- Factory-by-name OR `create*` factory with **any required field** → `*Input` (paired with `input` parameter).

```ts
// ✓ Right — factory-by-name (function name = domain noun)
function openai(options: { apiKey: string; baseUrl?: string }): Translator { ... }
function cookie(options: { name: string }): Persistence { ... }

// ✓ Right — create* factory with required fields → *Input
function createTranslator(input: CreateTranslatorInput): Translator { ... }
function createProcessor(input: CreateProcessorInput): Processor { ... }

// ✗ Wrong — function uses non-factory verb prefix → exception does NOT apply
function buildError(options: { code: string; message: string }): YapyakError { ... }
// → Required → positional: buildError(message: string, code: string)
```

**Mechanical test:** Is the function name (a) a bare noun matching the domain object it produces, per [[naming]] § Factory-by-name pattern, OR (b) uses the `create*` verb prefix to construct a domain object? Yes → exception applies. No → default rule applies.

This exception applies only to functions, not to ordinary methods or constructors.

#### Hard cap — 5+ required positional arguments

When a function would need **5 or more required positional arguments**, you MUST refactor. Lift the recurring sub-bundles into named domain types (`*Input` / `*Request` / `*Context` / `*Config`) per the recipe below.

**Mechanical test:** Count the required positional arguments. ≥5 → trigger the refactor recipe.

#### Refactor recipe (when hard cap triggers, or when a `*Options`-with-required is found)

Sequential, deterministic steps. No judgement.

1. **List every required field** with one-line semantics.
2. **Cluster** by concept. Typical clusters:
   - **Operation input** — varies per call (the data being processed).
   - **Domain context** — stable per project/session (config, paths, services).
   - **Optional tweaks** — behavior flags with defaults.
3. **Cross-check clusters against other functions.** If a cluster (≥2 fields) appears in 2+ functions → lift to a shared domain type (`*Context` for cross-cutting state, `*Config` for user configuration).
4. **Function-specific clusters** become a `*Input` or `*Request` type owned by the function's file.
5. **Optional tweaks** become a `*Options` type (no required fields, per suffix rule).
6. **New signature:** `fn(input: *Input, context: *Context, ...standalone positionals, options?: *Options)`. The result is typically 2–4 positional args, all with crystal-clear semantics. **Universal positionals** (single fields used by many functions across domains, e.g. `projectRoot: string`) stay as standalone positional arguments — not folded into any bundle.

#### Worked examples

| Signature | Layer that applies | Why |
| --- | --- | --- |
| `parseCookie(header: string)` | Default | 1 required → positional |
| `setLocale(value: string)` | Default | 1 required → positional |
| `t(key: string, params: ParamDict)` | Default | 2 required, both positional |
| `format(value: T, options?: FormatOptions)` | Default | 1 required positional + optional bundle |
| `interpolate(template: string, params: ParamDict, locale: string)` | Default | 3 required, all positional |
| `new YapyakError(message: string, options: { code: string; ... })` | Exception A | extends `Error`; code in options because upstream is locked to `(message, options)` |
| `openai(options: { apiKey: string; ... })` | Exception B | Factory-by-name; required `apiKey` allowed in options |
| `cookie(options: { name: string })` | Exception B | Factory-by-name |
| `createTranslator(input: CreateTranslatorInput)` | Exception B | `create*` factory; required `translate` allowed in input |
| `createProcessor(input: CreateProcessorInput)` | Exception B | `create*` factory; required `id`, `extensions` allowed in input |
| `migrateLocales(input: MigrateLocalesInput, context: LocaleContext, projectRoot: string, options?: { preserveTranslations?: boolean })` | Hard cap + Suffix | Originally 8 required in `*Options` → refactored: domain context lifted, projectRoot kept as universal positional, tweaks moved to `*Options` |
| `transferMoney(from: string, to: string)` | Default | Same-typed positional is NOT an exception — keep both positional |

#### Anti-patterns

Recognize and reject these in code review:

- **`*Options` with any required field** — rename to `*Input` if the bundle is a coherent operation-input, or move the required field to positional.
- **`*Input` with 6+ fields where 3+ of them appear in another function's `*Input`** — missed domain bundle. Identify the cluster, lift to a shared `*Context` or `*Config` type, retain only function-specific fields in the `*Input`.
- **`*Context` with only 1–2 fields** — likely not a coherent concept. Either inline the fields as positional args or wait for a third co-occurrence before lifting.
- **Same fields repeatedly destructured at call sites** (e.g. `{ defaultLocale, locales, localesDir } = config` in 5 places) — missed `Pick<>` or named domain type.
- **Two function-prefixed `*Input` types sharing 4+ fields** — they belong in a shared `*Context`; the function-prefixed types should hold only the function-specific delta.
- **Required-in-options "to self-document the call site"** — never. Use the suffix. If you need self-documentation, the type should be `*Input` or `*Request`.

#### Same-type positional ambiguity is not an exception

If two required arguments are the same primitive type (`transferMoney(from: string, to: string)`), keep both positional. Lean on the function signature and IDE tooltips for clarity — that's what TS is for. Never move required values into `options` to "self-document" the call site.

### Null/undefined checks

Three-tier rule. Pick by what you're trying to express, not by habit.

#### 1. Defaulting — always use `??`

For "use this value, or fall back if not set":

```ts
// ✓
const localesDir = config.localesDir ?? 'locales';
const temperature = options.temperature ?? 0.2;   // 0 still passes through
const enabled = options.enabled ?? true;          // false still passes through

// ✗ — verbose, no benefit
const localesDir = config.localesDir !== undefined ? config.localesDir : 'locales';
```

`??` only triggers on `null`/`undefined`. Safe for every type including booleans, numbers where `0` is meaningful, and strings where `""` is meaningful. Always prefer over `||` for defaults.

#### 2. Truthy checks — when `T` has no meaningful falsy value

Use `if (x)`, `x && ...`, `!!x` when the type is `T | undefined` and `T` does NOT include a falsy value that's semantically distinct from "not set":

| `T` is | Truthy check safe? |
|---|---|
| object / array / class instance | ✓ |
| function | ✓ |
| string where `''` means "not set" | ✓ |
| number where `0` is invalid / impossible | ✓ |
| `boolean` | ✗ — collapses `false` and `undefined` |
| number where `0` is valid | ✗ — collapses `0` and `undefined` |
| string where `''` is semantically distinct from `undefined` | ✗ |

```ts
// ✓
if (translator) { ... }                            // Translator | undefined
collapsible: !!pkg.group                           // string | undefined → boolean
result && doStuff(result)                          // narrowing guard

// ✗ — boolean | undefined where false matters
if (options.detectUserLocale) { ... }          // false silently treated as "not set"
```

`!!x` is the idiomatic boolean coercion. `Boolean(x)` is also fine but reads as a function call.

#### 3. `=== undefined` — when falsy values are meaningful

Use explicit comparison when you need to distinguish "not set" from a meaningful falsy value:

```ts
// ✓ — boolean | undefined where false is a real configuration choice
if (options.detectUserLocale !== undefined) {
  // user explicitly passed true OR false
}

// ✓ — diagnostic distinguishing which falsy value arrived
const received = options.apiKey === undefined ? 'undefined' : 'empty string';

// ✓ — narrowing where 0 must remain usable
if (count === undefined) initialize();
else use(count);                                    // count: number, includes 0
```

For `T | null | undefined`, use `value == null` / `value != null` (double-equal catches both).

#### The footguns

1. **`boolean | undefined` with defaults** — `enabled?: boolean` where `undefined` means "use default" and `false` means "explicitly off". Truthy-check collapses them. Use `enabled ?? defaultValue` for the default, or `enabled !== undefined` to branch on explicit-vs-unset.

2. **Numbers where `0` is valid** — `temperature?: number` accepts `0`. `if (temperature)` treats `0` as missing. Use `temperature ?? 0.2`. (`??` saves you here — you rarely need raw `=== undefined` for numerics.)

3. **JSX conditional rendering** is a separate context — see [[react]] § Conditional rendering for the JSX-specific rule (always truthy `&&`).

#### No silent fallbacks for values that should exist

`?.` and `??` quietly hide bugs when a value was supposed to be there. If a value's type doesn't permit absence, never reach for the fallback operators "just in case."

```ts
// ✗ Wrong — masks the real problem
const name = user?.profile?.name ?? 'Unknown';      // if user/profile should always exist, throw instead
config?.endpoint?.url?.trim();                       // silently does nothing when missing

// ✓ Right — assert presence explicitly
if (user.profile === undefined) {
  throw new Error('User profile missing');
}
const name = user.profile.name;
```

`?.` and `??` are reserved for **genuine optionality** (the type says `T | undefined` and the calling context truly accepts the missing case — e.g. defaults, optional config). Not for paranoid defensive coding against types you control.

### Prefer `===` over `!==`

Positive comparisons read easier than negations. When a ternary or condition can be written either way, flip it so `===` comes first.

```ts
// ✗ Wrong — negation in true branch
const rows = block.head !== null ? [block.head, ...block.body] : block.body;

// ✓ Right — flip so === holds the simple branch
const rows = block.head === null ? block.body : [block.head, ...block.body];
```

For `if`-statements, prefer **early return on the negative case**:

```ts
// ✗ Wrong — nests the happy path under negation
function use(value: string | null) {
  if (value !== null) {
    doStuff(value);
  } else {
    handleMissing();
  }
}

// ✓ Right — guard then proceed
function use(value: string | null) {
  if (value === null) {
    handleMissing();
    return;
  }
  doStuff(value);
}
```

**Exception:** `!==` is fine when there's no equivalent positive form (e.g. `array.filter((x) => x !== current)`) or when flipping would make the code less readable.

### Pass function reference directly when callback signature matches

When a callback function takes exactly one argument with the matching type, pass the function reference directly instead of wrapping it in an arrow that just re-calls it.

```ts
// ✓ Right — direct reference
return block.children.map(blockToText).join('');
return items.filter(isActive);
return values.flatMap(normalize);

// ✗ Wrong — unnecessary arrow wrapper
return block.children.map((child) => blockToText(child)).join('');
return items.filter((item) => isActive(item));
return values.flatMap((value) => normalize(value));
```

**Wrap in an arrow only when:**
- The function takes more than one argument
- The function has optional parameters that could be polluted by callback's extra args (`index`, `array`)
- The argument needs reshaping (e.g. property access, partial application)

```ts
// ✓ Right — parseInt has optional radix; .map would pass index as radix → bug
['1', '2', '3'].map((value) => parseInt(value, 10));

// ✓ Right — Number takes only first arg meaningfully, but the explicit wrap is clearer
['1', '2', '3'].map((value) => Number(value));

// ✓ Right — accessing a property, not calling a function
items.map((item) => item.id);
```
