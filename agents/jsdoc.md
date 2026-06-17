## JSDoc

The standard is TSDoc (Microsoft's TypeScript-aware spec, used by TypeDoc and api-extractor) — not generic JSDoc.

### Generation algorithm

```
0.  Verify against code. Read the implementation; search for callers and tests when behavior is non-obvious. Stop if not verifiable. See [[general]] § Verify against code.
1.  Determine kind: function / type / interface / const / property.
2.  Apply category decision tree → category + formula.
3.  Look up name in the Qualifier table — prepend qualifier if matched.
4.  Apply Acronyms table to the formula's filled slots.
5.  Write summary using the formula (≤ 100 chars, period, 3rd-person indicative).
6.  Add second sentence ONLY if the name is opaque per the trigger list.
7.  Add @remarks ONLY if actionable nuance exists. Otherwise omit the block.
8.  List @typeParam tags (alphabetical).
9.  List @param tags in signature order — names match exactly, hyphen separator.
10. Add @defaultValue (properties only).
11. Add @throws per non-trivial exception type.
12. Add @example if the category requires one (see @example rules).
13. Run the pre-publish audit checklist.
```

### Worked examples

#### Example: `createTranslator()`

1. Kind: function.
2. Category: name starts with `create*`, returns new instance → Factory.
3. Qualifier: `createTranslator` → not listed.
4. Formula: `Creates a [T] [minimal-context].` → `Creates a translator.`
5. Acronyms: none in result.

#### Example: `TranslateRequest`

1. Kind: interface.
2. Category: suffix `*Request` → suffix formula.
3. Qualifier: `TranslateRequest` → not listed.
4. Formula: `Request shape for [endpoint].` → `Request shape for translate.`
5. Acronyms: none in result.

#### Example: `apiKey` field on `AnthropicOptions`

1. Kind: property.
2. Pattern: Value.
3. Qualifier: `apiKey` → not listed.
4. Formula: `The [thing].` → `The api key.`
5. Acronyms: `api` → `API` → `The API key.`

#### Example: `status` field on `Response`

1. Kind: property.
2. Pattern: Value.
3. Qualifier: `status` → HTTP.
4. Formula: `The [qualifier] [thing].` → `The HTTP status.`
5. Acronyms: `HTTP` already uppercase.

### Scope — what gets JSDoc

| Visibility | JSDoc |
| --- | --- |
| Public (re-exported from `src/index.ts`) | Full block. No exceptions. |
| Cross-package semi-public (re-exported from `src/internal.ts`) | None. The subpath is the boundary signal; no comment in the file. |
| Intra-package semi-public (domain barrel only) | None. |
| Private (not re-exported) | None. |
| Tests | None. |

Type-only symbols on the public surface (interfaces, type aliases, enums) follow the same rule as functions.

### Tag categories

TSDoc groups tags into three categories. The category dictates placement.

| Category | Placement | Examples |
|---|---|---|
| **Modifier** | Standalone line, before description | `@public`, `@beta`, `@alpha`, `@experimental`, `@deprecated`, `@override`, `@sealed` |
| **Block** | After description, separate paragraphs | `@param`, `@throws`, `@remarks`, `@example`, `@see`, `@defaultValue`, `@typeParam` |
| **Inline** | Embedded within prose using `{@tag content}` | `{@link Symbol}`, `{@inheritDoc Symbol}` |

### Canonical tag order

```
@public | @beta | @alpha | @experimental    ← release stage (one only, optional)
@deprecated [+ migration path]               ← optional
[summary — single sentence, period]

@remarks
[longer prose — only when summary needs expansion]

@typeParam T - description                   ← generics, alphabetical
@param name - description                    ← signature order
@defaultValue [value]                        ← for properties only
@throws {ErrorClass} when [condition]
@see {@link OtherSymbol}                     ← only when not already linked inline
@example [optional title]
  ```ts
  // code
  ```
```

Empty lines separate the summary, `@remarks`, and each tag block.

### Description rules

- **Summary line:** one sentence, sentence-case capital letter at start, period at end. **Hard limit 100 characters** (single-line readability in IDE quick-info). If the summary won't fit, the overflow goes in `@remarks` — never a longer summary.
- **No hard-wrapping.** JSDoc prose is never manually line-wrapped. Each paragraph is a single physical line: the summary, each `@remarks` paragraph, each `@param`/`@typeParam` description. Long lines are fine; the editor soft-wraps. Paragraph breaks inside `@remarks` still use a blank `*` line per the whitespace rules.
- **3rd-person indicative.** Descriptions describe what the symbol *is* or *does*. Never imperative directions to the reader (`Wrap the app once at the root.`). Imperatives belong in `@example` (as code or title), never in description prose. Acceptable: `Wraps the React tree once at the root level.` / `Subscribes the component to locale changes.`
- **Present tense, active voice.** No future ("will"), no passive.
- **No second-person pronouns or possessives.** Never "your", "yours", "you" in descriptions. JSDoc describes the field's *content*, not the reader. Use article + noun (`The X` not `Your X`). Imperative directions inside `@remarks` may use "you" if absolutely needed, but prefer impersonal phrasing (`"Place at the root"` not `"Wrap your app at the root"`).
- **No arbitrary domain elaboration in summaries.** The summary must be derivable from the symbol's **name + category + immediate type signature** alone. Never inject provider-specific, product-specific, or API-product-name elaboration in the summary. Move such detail to `@remarks` if it's worth documenting.
  - ✗ "Creates a translator backed by the OpenAI Chat Completions API." — "Chat Completions" is product-name detail, not derivable from `openai()` name.
  - ✗ "Creates a translator backed by the Anthropic Messages API." — same problem with "Messages".
  - ✓ "Creates an OpenAI translator." / "Creates an Anthropic translator." — name-driven.
  - Provider/backing-API detail goes in `@remarks`.
- **All `@remarks` content ends with period.** Each sentence in `@remarks` is a full sentence with capital start and period end, just like the summary. `@remarks` is prose, not a value.
- **Defaults live only in `@defaultValue`.** Never write "(default: X)", "Defaults to X.", or "Default." inline in a description, variant bullet, or `@remarks` block. The `@defaultValue` tag is the only home for default values. If a type's default depends on which consuming field, declare it on the field — never on the type.
- **Parallelism in sibling descriptions.** Whenever multiple items are documented at the same level — union variants, sibling option fields of similar kind, repeated callouts — every item follows the **same shape**: same verb, same structure, same content category, same length-tier. No relative references between siblings ("X plus the snippet"). No editorializing on one variant that the others lack. If one item needs a longer explanation, all do — or that explanation goes into `@remarks` on the parent.
- **Normal English prose only.** Each clause is a complete grammatical sentence. No telegraphic labels joined by semicolons (`Privacy-strict; nothing leaves the project.`). No hyphen-stitched jargon-adjectives as standalone qualifiers (`Privacy-strict.`, `Performance-critical.`). If a property needs to be flagged, write it as a full sentence in `@remarks`: *"Sends nothing beyond the source string — safe for privacy-restricted environments."*
- **Backticks** around code identifiers, types, values, file paths: `t()`, `string`, `null`, `'cookie'`, `package.json`.
- **Banned verbs in descriptions:** "gets", "sets", "gets or sets" — use category formulas instead.
- **Banned adverbs:** "simply", "just", "easily", "automatically".
- **No redundant subject:** "The type." not "The type of this attribute."
- **Reference other symbols with `{@link}`** — never restate what they are.
- **`{@link}` vs backticks — mechanical rule:**

  | Symbol kind | Form |
  |---|---|
  | Public symbol reachable in the same project (function, type, interface, const exported from a public entry) | `{@link Symbol}` |
  | Third-party type, literal value, internal-only symbol, file path, string literal | `` `value` `` |

  Examples: `{@link Translator}`, `{@link createTranslator}`, `{@link t}`. But: `` `null` ``, `` `'cookie'` ``, `` `package.json` ``, `` `Promise<T>` ``, `` `accept-language` ``.

### Qualifier table

Polysemous property names take a domain qualifier in their description. The qualifier is fixed per property name — never context-dependent at write-time. If a property is named `status` but isn't HTTP-related, rename the property — never override the qualifier.

| Property name | Qualifier |
|---|---|
| `method` | HTTP |
| `status` | HTTP |

When a property name matches a row, the formula's `[name]` slot expands to `[qualifier] [name]`. Property names not in the table use their literal name. Project-specific extensions live in the project's own rule file; the table is extended before any new qualifier is used.

### Function category formulas

Apply the decision tree top-down. First match wins.

| Signal | Category | Formula |
|---|---|---|
| Name `is*` / `has*` / `can*` / `should*` and returns `boolean` | Predicate | "Whether [subject] [predicate]." |
| Return type `x is T` | Type guard | "Type guard — narrows [X] to [T] when [condition]." |
| Name `use*`, returns hook value | Hook | "[Verb-phrase action of the hook]." |
| Name PascalCase, returns JSX/ReactElement | Component | "Renders [what]." |
| Name `create*` / `make*`, returns new instance | Factory | "Creates a [T] [minimal-context]." |
| Name is a brand / provider / source identifier (lowercase function), returns instance of T | Provider factory | "Creates [an\|a] [CapitalizedName] [T]." |
| Name `find*` / `lookup*`, returns `T \| undefined` | Finder | "Finds [what] by [key]. Returns `undefined` if [condition]." |
| Name `parse*` | Parser | "Parses [input] into [output]." |
| Name `validate*` / `check*`, throws on failure | Validator | "Validates [target]. Throws if [condition]." |
| Name `to*` / `from*`, pure transform | Converter | "Converts [from] to [to]." |
| Returns `Promise<T>` | Async | (apply base category) + "Resolves to [value]." |
| Side effects, returns `void` or mutated value | Mutator | "[Verb] [target]." |
| Name starts with an imperative verb from the Action verb list, returns non-void | Action | "[Verbs-3p] [target]." |
| Name `with*`, takes a value and a `fn` callback | Scope binder | "Runs `fn` with [value] bound to [scope]." |
| Const named `middleware` / `handle` / `integration` with host-framework type | Host integration | "[Capitalized symbol-name] for [package identifier]. Provides yapyak's per-request locale context." |
| Const exported as a framework-specific reactive primitive | Reactive binding | "Reactive [identifier] [binding-kind]." |
| Otherwise (returns derived value, noun-named) | Getter | "The [thing]." |

#### Action verb list

Closed set. Extend before coining. Names are tested case-insensitively against the camelCase first word.

```
apply, build, compile, decode, detect, discover, dispatch, emit, encode,
extract, fetch, format, generate, load, merge, migrate, normalize, read,
register, render, resolve, run, save, send, sync, transform, walk, write
```

`[Verbs-3p]` = first camelCase word with `s` appended (`extract` → `Extracts`, `discover` → `Discovers`, `apply` → `Applies` — standard English 3rd-person singular).

`[target]` = the function's output noun, verified against the implementation (see [[general]] § Verify against code). Never derived from the function name's suffix alone — `extractFile` extracts *messages from* a file, not "a file".

#### Reactive binding kind table

The `[binding-kind]` slot in the Reactive binding formula is determined by the host framework. Closed set per framework.

| Framework | `[binding-kind]` |
|---|---|
| React | hook |
| Solid | signal |
| Svelte | store |
| Vue | ref |

The `[identifier]` slot is the symbol name verbatim (lowercase const names stay lowercase). The framework is identified by the host package's identifier from the project's role table.

### Type / interface category formulas

Suffix-driven, matches the type suffix vocabulary from [[naming]].

| Suffix | Formula |
|---|---|
| `*Options` | "Options for [function]." |
| `*Config` | "Configuration for [thing]." |
| `*Result` | "Result of [function]." |
| `*Request` | "Request shape for [endpoint]." |
| `*Response` | "Response shape for [endpoint]." |
| `*Event` | "Event emitted when [condition]." |
| `*Entry` | "A single [item] in [container]." |
| `*Item` | "An item in [collection]." |
| `*State` | "State of [thing]." |
| `*Context` | "[Type] context for [purpose]." |
| `*Error` | "Error thrown when [condition]." |
| `*Tag` / `*Kind` | "Discriminator for [union type]." |
| `*Props` | "Props for {@link Component}." |

For inline-union types (no name), put the JSDoc on the **field** that holds the union — not on a separate type alias (see [[base]] § Union types — inline vs named).

### Type / interface description — deterministic first sentence

When no suffix formula above applies:

1. Has a known suffix from the table above? → use suffix formula.
2. Is a callable interface (function-like)? → use the function-category formula (Predicate, Factory, Mutator, etc.).
3. Otherwise (data type, enum, literal union, plain data interface):
   - **First sentence:** `The [name-as-noun-phrase].` — convert PascalCase to spaced lowercase. Always.
   - **Second sentence — when REQUIRED (mechanical trigger):**
     - Name ends with a pure discriminator suffix: `Level`, `Mode`, `Kind`, `Type`, `Tag`, `Group`.
     - Name is a generic placeholder used standalone: `Result`, `Config`, `State`, `Context` without a prefix that contextualizes it.
     - Name resolves to ≤ 1 substantive word after PascalCase split (e.g., `Locale`, `Translator`).
   - **Second sentence — when OPTIONAL:** any other case. If the name carries the concept (e.g., `MessageContext`, `TranslateRequest`, `LocaleSelector`), the second sentence is omitted unless an actionable behavior-clause genuinely adds information.
   - **Second sentence form:** single sentence, verb-driven (`Determines …`, `Holds …`, `Wraps …`, `Carries …`, `Lists …`, `Maps …`), period at end.

```ts
// ✓ ContextLevel — name + role
/**
 * The context level. Determines how much call-site context is passed to the translator.
 */
export type ContextLevel = 'none' | 'minimal' | 'rich';

// ✓ MessageContext — name alone is enough
/**
 * The message context.
 */
export interface MessageContext { /* ... */ }

// ✓ Translator — callable interface, use function-category formula instead
/**
 * Translates source strings into target locales.
 */
export interface Translator {
  (request: TranslateRequest): Promise<string>;
}

// ✗ Wrong — natural prose, no determinism
/**
 * How much call-site context to pass to the translate function.
 */
export type ContextLevel = 'none' | 'minimal' | 'rich';
```

Name-restate rules:

- PascalCase → spaced lowercase: `ContextLevel` → "context level"; `MessageContext` → "message context".
- Acronyms preserved per the Acronym table: `APIKeyConfig` → "API key config" (then matches `*Config` suffix formula).
- Verb-formed nouns kept as-is: `TranslateItem` → "translate item" (mechanical, even when "translation item" reads more naturally — the type was named with the verb, the description matches).
- The first article is always `The`. Never `A` / `An`. (The `*Entry` / `*Item` suffix formulas use `A`/`An` deliberately; everything else is `The`.)

Second-sentence rules (when present):

- Single sentence, period at end.
- Verb-driven: `Determines …`, `Holds …`, `Wraps …`, `Carries …`, `Lists …`, `Maps …`.
- No editorializing, no examples in prose (examples go in `@example`).
- If two sentences aren't enough, the rest goes in `@remarks`.

### `@param` rules

- **Verification.** Read the parameter's use site in the implementation before writing its description. Check for auto-detection logic, validation, defaulting, and special cases. The description states what the code actually does — never what the name suggests.
- **Format:** `@param name - description` — required hyphen separator per TSDoc.
- **No types in `@param`.** TypeScript already has the type in the signature. Including `{Type}` is forbidden (TSDoc rule, also enforced by Google TS style guide).
- **Every parameter gets a description.** No exceptions.
- **Order matches the signature exactly** — same names, same order.
- **Required vs optional** is implicit from the `?` in the signature, not stated in the description.
- **One paragraph per `@param`.** No multi-line prose unless absolutely required.

```ts
// ✓ Right
/**
 * Creates a translator from the given options.
 *
 * @param options - The translator configuration.
 */
function createTranslator(options: TranslatorOptions): Translator;

// ✗ Wrong — types in @param
// @param {TranslatorOptions} options - ...

// ✗ Wrong — missing hyphen
// @param options The translator configuration.

// ✗ Wrong — description states optionality
// @param options - Optional translator configuration.
```

### `@param` description patterns

| Pattern | Formula | Example |
|---|---|---|
| Boolean — **state predicate** (the thing *is*/has X) | "Whether [subject] is/has [adjective]." | "Whether the attribute is filterable." |
| Boolean — **behavior flag** (enabling causes action) | "Whether to [verb-phrase]." | "Whether to detect locale from the `Accept-Language` header." |
| Boolean (auto-detect) | "Whether [subject]. If `undefined`, auto-detected from [source]." | "Whether the value can be `null`. If `undefined`, auto-detected from column constraint." |
| Value | "The [thing]." | "The locale code." |
| Value (auto-detect) | "The [thing]. If `undefined`, auto-detected from [source]." | "The type. If `undefined`, auto-detected from the source." |
| Callback | "Called when [event]." | "Called when the locale changes." |
| Options bundle | "Options bundle. See {@link OptionsType}." | "Options bundle. See {@link TranslatorOptions}." |

**State predicate vs behavior flag — disambiguation:** matches the boolean-naming rule in [[naming]] § Boolean naming. A field named with a bare adjective (`disabled`, `selected`) is a state predicate. A field named with a verb-phrase (`detectAcceptLanguage`, `syncHtmlLang`, `preserveTranslationsOnRename`) is a behavior flag. The description form must match the field-name form.

### Options interface field order — alphabetical

When a type lists fields:

- Fields are **alphabetical** by name.
- The `?` (optional marker) is **not** a sort key. `acceptLanguage?` sorts under `a`, not at the bottom.
- **Single exception:** in tagged unions, the discriminator field (`type`, `kind`) comes **first** in each variant. All other fields alphabetical.

```ts
// ✓ Right — alphabetical
interface YapyakOptions {
  defaultLocale?: string;
  detectAcceptLanguage?: boolean;
  exclude?: FilterPattern;
  include?: FilterPattern;
  localesDir?: string;
  persistence?: PersistenceOption;
  preserveTranslationsOnRename?: boolean;
  syncHtmlLang?: boolean;
  translator?: Translator;
}

// ✓ Right — discriminator first per variant
type Shape =
  | { type: 'circle'; radius: number }
  | { type: 'square'; side: number };
```

Positional function parameters keep **signature order** (domain-driven: `migrate(from, to)` not `migrate(to, from)`). Alphabetical only applies inside object literal field lists.

### `@returns` — banned

Never use `@returns`. Return values are documented by the type signature alone.

Rationale: any `@returns` description either (a) restates the return type (noise) or (b) adds prose that is per-author judgment, which produces inconsistent docs across the library. The bar "adds info beyond the type" is unenforceable and inevitably gets stretched. Banning the tag removes the judgment call entirely.

If a function's return value genuinely needs explanation, the explanation goes in the **summary** or `@remarks` — describing what the function *does* — not in a separate `@returns` block. The renderer does not produce a "Returns" section.

This applies to `Promise<T>` and every other return shape. No exceptions.

```ts
// ✗ Wrong — uses @returns
/**
 * @returns The locale that was actually applied, after fallback resolution.
 */
function setLocale(locale: string): string;

// ✓ Right — return semantics in the summary
/**
 * Sets the active locale. The applied locale may differ from the input after fallback resolution.
 */
function setLocale(locale: string): string;

// ✓ Right — type alone suffices, no extra prose
/**
 * The current locale.
 */
function getLocale(): string;
```

### `@defaultValue`

For properties with a default. Goes after `@param`, before `@throws`.

```ts
interface YapyakOptions {
  /**
   * Glob patterns to include for extraction.
   *
   * @defaultValue `['**\/*.{ts,tsx}']`
   */
  include?: FilterPattern;
}
```

Use `@defaultValue` instead of prose like *"defaults to X"* or *"(default: X)"* in the description.

### `@throws`

- Required when the function throws a non-trivial error.
- Format: `@throws {ErrorClass} when [condition]`
- One `@throws` block per exception type. Multiple blocks if multiple exception types.

```ts
/**
 * @throws {DynamicSourceError} when the source argument is not a string literal.
 * @throws {ParseError} when the file cannot be parsed.
 */
```

### `@typeParam` — generics

Required when the type parameter is part of the public contract. Format: `@typeParam T - description`.

- One block per type parameter, alphabetical order.
- No `{Type}` annotation — the constraint is in the signature.

```ts
/**
 * Creates a typed key-value map.
 *
 * @typeParam TKey - The key type. Must be string-keyed.
 * @typeParam TValue - The value type.
 */
function createMap<TKey extends string, TValue>(): Map<TKey, TValue>;
```

### `@deprecated`

Always include a migration path. Never a bare `@deprecated` tag.

```ts
// ✓ Right
/**
 * @deprecated Use {@link createTranslator} instead.
 */
export function makeTranslator(): Translator;

// ✗ Wrong — no migration path
/**
 * @deprecated
 */
```

For longer migration guidance, put it in the deprecation message:

```ts
/**
 * @deprecated Use {@link createTranslator} with `voice` option.
 * The old `voice()` setter was removed in 2.0.
 */
```

### `{@link Symbol}` — inline cross-references

The primary cross-reference mechanism in TSDoc. Use it within prose, not `@see`.

```ts
// ✓ Right — inline link
/**
 * Wraps the response according to {@link Wrapper} configuration.
 */

// ✗ Wrong — @see when inline link would do
/**
 * Wraps the response according to the configured wrapper.
 *
 * @see Wrapper
 */
```

Use `@see {@link X}` **only** when the related symbol is not naturally referenced in the description prose. Never duplicate — if `{@link X}` appears in the description, no `@see X` below.

### `@remarks` — beyond the summary

The summary is one sentence. Anything longer goes in `@remarks`. The summary shows up in IDE quick-info / hover; `@remarks` only renders in full-page documentation.

#### Verification

Each remark must reflect verified behavior. Writing "Notifies subscribers in registration order" means the notification dispatch code has been read. Writing "Cache survives between builds" means the cache persistence code has been read. No behavior claim without source code to back it.

#### Triple test

A behavior detail belongs in `@remarks` only when all three are true:

1. **Unique** — the behavior is specific to this symbol, not shared with siblings in the same category.
2. **Actionable** — the consumer must act on the information.
3. **Not derivable** — the summary, signature, name, and category formula don't already convey it.

If even one fails, omit. Shared category behaviors live in the category formula's boilerplate sentence (see Function category formulas § Host integration). Implementation details that the consumer never observes at the call site never appear at all.

| Do | Don't |
|---|---|
| Behavioral caveats and edge cases ("Notifies subscribers in registration order.") | Restatement of what the symbol's name already conveys. |
| Performance characteristics ("Memoized per source string; cache survives between builds.") | Decorative single facts ("Backed by the X API.") — put it on the relevant option field or default value instead. |
| When-to-use vs. when-not-to-use ("The shipped adapters call this for you. Use it directly only when wiring a custom SSR setup.") | Marketing-flavored prose. |
| Mental model context ("Re-renders descendants when the locale changes.") | "This is useful for…" without naming the specific case. |

#### No code blocks

Code belongs in `@example`. `@remarks` is prose only — no fenced code blocks, no indented code, no inline multi-line snippets. Inline backticks for token names (`` `null` ``, `` `package.json` ``) are fine.

#### Configuration prerequisites

Host config flags and environment-variable requirements use a fixed form:

```
Requires `[flag]` in `[file]`.
```

Examples: `` Requires `future.v8_middleware: true` in `react-router.config.ts`. ``, `` Requires `YAPYAK_API_KEY` in the environment. ``

#### Framework versions never appear in JSDoc

Host-framework version requirements live in `package.json` `peerDependencies` only. Reference renders peerDependencies separately. Restating the version in JSDoc creates two sources of truth and they drift on day one.

```ts
/**
 * Creates a translator from the given options.
 *
 * @remarks
 * The translator caches results per source string and persists them between
 * builds. Clearing the cache requires deleting the locale files manually.
 *
 * @param options - The translator configuration.
 */
```

### `@example`

- **Required for:** hooks, factories with non-trivial flow, provider factories, async functions, type guards with non-trivial narrowing, builders, callbacks-as-args, anything where the signature alone doesn't show usage.
- **Optional for:** predicates, simple converters, getters, components with obvious props.
- **Code must be runnable** — copy-paste-works.
- **Always include imports.** Every `@example` ships the necessary `import` statements. Even if redundant across sibling examples. The reader copy-pastes into a fresh file.
- **Parallel import forms.** When an example shows the project's symbol alongside a placeholder for a sibling symbol, both imports use the **same form**. If we write `import { middleware as yapyakMiddleware } from 'yapyak/adapter/astro';`, the user's stand-in must mirror that shape: `import { middleware as authMiddleware } from './auth';` — never `import { authMiddleware } from './auth';`. Same rule for any other symbol kind (`{ handle as X }`, `{ default as X }`, etc.). Parallelism makes the example read as "two of the same thing", not "ours vs theirs".
- **No placeholder identifiers** in examples. Pull from the Yak Pool in [[testing]] § Test voice.
- **Return values:** show with `// =>` — one space before, no column alignment.
- **Code-block language identifier — mechanical choice:**

  | Content | Identifier |
  |---|---|
  | TypeScript with JSX | `tsx` |
  | TypeScript without JSX | `ts` |
  | JavaScript with JSX | `jsx` |
  | JavaScript without JSX | `js` |
  | Vue single-file component | `vue` |
  | Svelte single-file component | `svelte` |
  | JSON | `json` |
  | Shell / pnpm / npm / bash | `shell` |

  Use the most specific applicable identifier. Never omit, never use plain ` ``` `.

- **Title format:** if a title is included, it's a **verb-phrase use case** (`Per-request locale in TanStack Start`, `Forced locale at the call site`, `Custom translator with fetch`). Omit the title for a single trivial example.
- **Titles are plain text — no markdown, no backticks, no HTML/JSX, no braces.** TSDoc parsers (TypeDoc, api-extractor) treat the first line of `@example` as a literal label and warn on any inline syntax. **The title line accepts plain English words only.** No exceptions.

  Forbidden in the title line:

  | Pattern | Example violation | Rewrite |
  |---|---|---|
  | Backticks | `` @example Render with `link` tag `` | `@example Render with link tag` |
  | HTML/JSX tags | `@example Render a `<link>` tag` | `@example Render a link tag` |
  | Curly braces | `@example Set t({ count: 2 })` | `@example Set t with count` |
  | File paths in backticks | `` @example Re-export from `src/middleware.ts` `` | `@example Re-export from src/middleware.ts` |
  | Markdown link | `@example See [docs](...)` | `@example See docs` |
  | Code snippets | `@example getLocale() returns sv` | `@example Get the current locale` |

  Mechanical test before writing the title: would it survive being copy-pasted into a `<h3>` heading without rendering as HTML or markdown? If no, rewrite it. Code, tag names, identifiers, and concrete syntax belong **inside the code block on the next line**, not in the title.

```ts
/**
 * Wraps a server adapter for per-request locale resolution.
 *
 * @example Per-request locale in TanStack Start
 * ```ts
 * import { withRequest } from 'yapyak/adapter/tanstack-start';
 *
 * export const Route = createServerRoute().loader(async ({ request }) => {
 *   return withRequest(request, async () => {
 *     return { locale: getLocale() };
 *   });
 * });
 * ```
 */
```

Multiple `@example` blocks order: lowest argument count first → increasing complexity → framework-specific cases last.

Composition / "use with other things" examples are justified only when:

1. The composition mechanism is **non-obvious** (e.g., a `sequence()` helper, a wrapper API), AND
2. The composition has a **canonical pattern** the consumer is expected to follow, AND
3. There's no plain-language way to convey it in `@remarks` alone.

If composition reduces to "add to the array" or "spread into the config", **drop the example**. That's host-framework documentation, not API documentation.

If composition has a **caveat** (ordering matters, state interactions, callback overlap), add a `@remarks` block describing the constraint *before* the compose `@example`. The caveat is non-optional — never ship a compose example that could mislead silently.

### `@packageDocumentation`

Required at the top of the **public** entry file (the one re-exported as `"."` in `package.json` `exports`). Documents the package itself.

The block is **not** required on the `/internal` entry file. Internal subpaths don't carry documentation — the subpath is the signal that this is implementation surface.

#### Canonical shape

Every public-entry `@packageDocumentation` block follows this exact shape, in this exact order:

```ts
/**
 * [Summary — one sentence, ≤ 100 chars, period.]
 *
 * ## Installation
 *
 * ```bash
 * npm install @scope/package-name
 * # or
 * pnpm add @scope/package-name
 * ```
 *
 * @packageDocumentation
 */
```

Mechanical rules:

- Heading is literally `## Installation` — no variation.
- Code fence language is `bash`. Never `shell`, `sh`, or omitted.
- Two-line install block: `npm install …` on line 1, `# or` on line 2, `pnpm add …` on line 3. No other package managers, no aliases (`npm i`), no flags.
- Package name in the install lines matches `package.json` `name` field verbatim.
- One blank line between heading and code fence, one blank line between code fence and `@packageDocumentation`.

#### Summary formula

The summary is derived from the package's role. The identifier is the human form of the package name — scope stripped, dashes to spaces, project's display casing (`@scope/react-router` → `React Router`, `@scope/tanstack-start` → `TanStack Start`).

| Category | Test | Formula |
|---|---|---|
| Foundation | Identifier matches another sibling's role (e.g., `Adapter` with siblings of role `adapter`) | `[Identifier] base for [project].` |
| Role-less | Package name is its role; no sibling has the identifier as a role | `[Identifier] for [project].` |
| Role-bearing | Package has an explicit role from the project's closed role set | `[Identifier] [role] for [project].` |

Apply tests top-down. First match wins.

#### Package identifier and role table

The identifier is the human form of the package name; the role determines the summary suffix. The set `adapter`, `base`, `plugin`, `translator` is closed — adding a new role requires amending this table before any package uses it.

| Package | Identifier | Role |
|---|---|---|
| `@yapyak/anthropic` | Anthropic | translator |
| `@yapyak/astro` | Astro | adapter |
| `@yapyak/gemini` | Gemini | translator |
| `@yapyak/ollama` | Ollama | translator |
| `@yapyak/openai` | OpenAI | translator |
| `@yapyak/react` | React | adapter |
| `@yapyak/react-router` | React Router | adapter |
| `@yapyak/svelte` | Svelte | adapter |
| `@yapyak/sveltekit` | SvelteKit | adapter |
| `@yapyak/tanstack-start` | TanStack Start | adapter |
| `@yapyak/vite` | Vite | plugin |
| `@yapyak/vue` | Vue | adapter |

The root `yapyak` package is intentionally absent — its summary (`Runtime API for yapyak.`) is hand-authored, not derived. The internal subsystems of `yapyak` (`adapter`, `cli`, `compiler`, `config`, `runtime`, `translator`) are subpath exports / folders within that one package, not separate packages, so they do not appear here.

`base` is reserved (used by the Foundation formula) but unused in this repo today.

**Banned in summaries:**

| Class | Examples |
|---|---|
| Adjectives | `basic`, `core` (as adjective), `low-level`, `main`, `reactive`, `shared`, `simple`, `unified` |
| Filler nouns | `binding`, `entry`, `entry point`, `helpers`, `orchestration`, `primitives`, `runtime`, `toolkit` |
| Marketing verbs | `Enables`, `Exposes`, `Powers`, `Provides`, `Wraps` |
| Cross-references | `{@link}` — covered by the Exports table on the rendered page |
| Listing | Enumerating what the package exports — covered by the Exports table |

### Release stage tags (optional, per project)

For projects that explicitly track API maturity, TSDoc supports modifier tags. Project-level decision — if the project uses one, it uses it consistently. Pick **one scheme** and stick with it:

| Tag | Meaning | Strip with api-extractor? |
|---|---|---|
| `@public` | Stable, part of the public API. | No |
| `@beta` | Released for feedback, may change. | Optional |
| `@alpha` | Unstable, internal preview. | Optional |
| `@experimental` | Same as `@beta`, for tools without `@alpha`. | Optional |

Default for our projects: **don't use release-stage tags.** Implicit publicness via "exported from entry = public" works for stable libraries. Add the tags only when explicitly versioning API maturity.

### Acronyms

Project acronyms are declared in [[testing]] § Acronyms. TypeScript-specific additions on top of the project list:

```
AMD, CJS, CSR, ESM, HMR, ISR, JSX, SPA, SSR, TSX, UMD
```

Apply the rule case-insensitive after any description formula. Pre-existing uppercase is fine.

### Sync rule

When a public API signature changes — parameter renamed, type changed, behavior changed — the JSDoc updates in the same commit.

Same applies when renaming a referenced symbol: every `{@link OldName}` must become `{@link NewName}` in the same commit.

### Whitespace inside a JSDoc block

Each block tag group is separated by an empty line. Items within a group are consecutive (no blank lines).

```
[summary]
                       ← empty line
@remarks
[remarks prose]
                       ← empty line
@typeParam T - ...
@typeParam U - ...     ← @typeParam group consecutive
                       ← empty line
@param a - ...
@param b - ...         ← @param group consecutive
                       ← empty line
@defaultValue ...
                       ← empty line
@throws {Err} when ...
                       ← empty line
@example
[example code]
```

`@remarks`, `@defaultValue`, and `@example` are each their own group (one tag, then blank line before the next).

### Standard phrasings — canonical forms for recurring scenarios

Pick from this catalog rather than inventing. Same scenario, same words.

| Scenario | Phrasing |
|---|---|
| Function throws on a condition | "Throws if [condition]." |
| Callback invoked on an event | "Called when [event]." |
| Symbol produced elsewhere | "Returned by {@link X}." / "Created by {@link X}." |
| Async resolves to a value | "Resolves to [value]." |
| Async rejects on a condition | "Rejects with {@link ErrorClass} when [condition]." |
| Type holds data | "Holds [content]." |
| Type wraps another | "Wraps {@link X}." |
| Map / lookup | "Maps [key] to [value]." |
| List / collection | "Lists [items]." |
| Auto-detected default | "If `undefined`, auto-detected from [source]." |
| Conditional default | "If `undefined`, defaults depend on {@link X}." |
| Discriminator | "Discriminator for {@link Union}." |
| No-op condition | "No-op if [condition]." |
| Build-time constant | "Build-time constant. Inlined by the {@link plugin}." |
| Side effect notice | "Notifies [subscribers]." |
| Same as another symbol | "Equivalent to {@link X}." |

If a scenario doesn't fit any row, write the most boring possible declarative sentence.

### Pre-publish audit checklist

For every public API symbol:

1. JSDoc block present.
2. Summary ≤ 100 chars, one sentence, period at end, capital letter at start.
3. Summary is 3rd-person indicative — no imperative direction to the reader.
4. Category formula applied (function or type table).
5. Second sentence present only when name triggers it (discriminator suffix, generic placeholder, ≤ 1 substantive word).
6. Acronyms uppercase.
7. `@param` matches signature order **and** names exactly.
8. `@param` uses hyphen separator (`name - description`), no types.
9. Boolean fields use the correct shape: `Whether [subject] is/has [adjective].` (state) or `Whether to [verb-phrase].` (behavior).
10. Options-interface fields alphabetical (discriminator first in union variants).
11. No `@returns` block — banned. Return semantics belong in the summary or `@remarks`.
12. `@example` present for required categories (hooks, factories, provider factories, async, type guards, callbacks-as-args).
13. `@example` includes imports.
14. `@example` code-block language identifier is the most specific applicable (`ts`/`tsx`/`vue`/`svelte`/...).
15. Multiple `@example` blocks ordered: lowest arg-count → complex → framework-specific.
16. `@typeParam` for every type parameter, alphabetical.
17. `@throws` for every non-trivial exception type.
18. `{@link}` used for in-project public symbols; backticks for literals, third-party, internal.
19. `@deprecated` always includes migration path.
20. `@remarks` adds actionable nuance, not decorative facts.
21. No defaults inline in prose — only `@defaultValue` tag.
22. No second-person pronouns (`your`/`you`/`yours`).
23. No domain elaboration in summary (API names, product names beyond the function name itself).
24. Sibling descriptions are parallel (same shape across union variants / option fields).
25. All sentences are full natural prose — no telegram fragments, no hyphen-jargon-adjective labels.
26. Whitespace: empty line between each tag group, none within groups.
27. Standard phrasings used where applicable (catalog).
28. No banned words (`gets`, `sets`, `simply`, `just`, `automatically`, `easily`).
29. No placeholder identifiers in examples — Yak Pool only.
30. Code in `@example` is runnable.
31. Canonical project example names used.
32. `@packageDocumentation` present on each public entry file.
