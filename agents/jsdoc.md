## JSDoc

The standard is TSDoc (Microsoft's TypeScript-aware spec, used by TypeDoc and api-extractor) — not generic JSDoc.

### Prime directives

These two rules outrank everything else in this file. When a category formula, a phrasing catalog entry, or any "should be present" instruction conflicts with them, they win.

**1. Omit before vague.**

If a fact cannot be stated mechanically (per a formula, the closed standard-phrasings catalog, or a verified observation from source) and **briefly**, it does not appear at all. A short, true, derivable summary beats a longer one that drifts into hedge words, hand-wave, or inference. When in doubt:

- Drop the second sentence rather than reach for "usually", "typically", "often", "sometimes", "may", "roughly", "approximately".
- Drop the `@remarks` rather than fill it.
- Drop the `@example` rather than fabricate a scenario.
- Drop the `@throws` rather than restate the type signature.

Empty is better than wrong. Empty is better than padded. A symbol with **only** a single-sentence category-formula summary is a complete, passing JSDoc block.

**2. Every claim is verified against actual source code.**

Every word in description, `@remarks`, `@param`, `@throws`, `@example`, and `@see` corresponds to a line of code that was read for this JSDoc block. No claim is written from:

- The symbol's name alone.
- A sibling symbol's JSDoc.
- External documentation of a delegated primitive (`Intl.NumberFormat`, `React`, etc.) without confirming the delegation.
- Recollection of how the symbol "probably" works.
- Inference from the call signature.

If the implementation cannot be read end-to-end (binary dependency, opaque generated code), the JSDoc stops at what the signature alone can support. Fabrication — describing behavior that is plausible but not verifiable — is the single hardest violation in this file. There is no fix at review time other than deletion: a claim that is plausible-but-unverified is poison, because future maintainers and AI agents will trust and propagate it.

When these two rules conflict with the urge to "say more", the rules win. Always.

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

Tags appear in this exact order. No variation. Every public JSDoc block follows the same outline — if a tag isn't used, the block skips its row; the remaining rows stay in this order.

```
@public | @beta | @alpha | @experimental    ← release stage (one only, optional)
@deprecated [+ migration path]               ← optional
[summary — single sentence, period]

@remarks                                     ← prose only, no code, triple-test
[longer prose — only when summary needs expansion]

@shape <inline signature override>           ← rendering-only, project-specific, before @typeParam
@typeParam T - description                   ← generics, alphabetical
@param name - description                    ← signature order
@defaultValue [value]                        ← for properties only
@throws {ErrorClass} when [condition]        ← one block per exception type
@see {@link OtherSymbol}                     ← only when target not structurally linked
@example [optional title]                    ← required for categories; ≤ 3 blocks
  ```ts
  // code
  ```
```

Empty lines separate the summary, `@remarks`, and each tag block. Inside a tag group of the same kind (e.g., consecutive `@param` lines), no blank lines.

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

### `{@link Symbol}` and `@see` — when to link, mechanical rule

Linking is mechanical. The rendered reference page **already** links every type in the Type column, every parameter type in the Param table, the Return type, and any formula-slot link in the summary. Do not duplicate those.

**Step 1 — is the target already structurally linked on this page?**

| Where target already appears | Then |
|---|---|
| Type column of a Members row, Param-type column, Returns row, or a formula-slot `{@link}` in the summary | **No link in prose. No `@see`.** Period. |
| Nowhere on this page | Continue to Step 2. |

**Step 2 — when an external link IS needed, pick form mechanically.**

| Link role in the sentence | Form |
|---|---|
| The link **is** the description subject (formula-slot) | Inline `{@link X}` |
| Genuine cross-reference to a different concept not visible elsewhere on the page | `@see {@link X}` block |

**Formula slots with an inline `{@link}`** — closed set, mirrors the category-formula tables:

- `Props for {@link Component}.`
- `Options for {@link function}.`
- `Result of {@link function}.`
- `Request shape for {@link endpoint}.`
- `Response shape for {@link endpoint}.`
- `Returned by {@link X}.`
- `Created by {@link X}.`
- `Equivalent to {@link X}.`
- `Discriminator for {@link Union}.`

Outside the formula-slot set, links never appear inside description prose. Either the target is already structurally linked (no link needed), or it isn't (use `@see`).

```ts
// ✓ Right — Type column already links Currency
/**
 * The currency code.
 */
currency: Currency;

// ✗ Wrong — Type column already links Currency; @see is a duplicate
/**
 * The currency code.
 *
 * @see {@link Currency}
 */
currency: Currency;

// ✗ Wrong — link inside prose is not a formula slot
/**
 * The currency code from the {@link Currency} set.
 */
currency: Currency;

// ✓ Right — formula slot
/**
 * Props for {@link RichText}.
 */
type RichTextProps<T extends string> = { /* ... */ };

// ✓ Right — genuine cross-reference, not visible elsewhere on this page
/**
 * Translates a source string for the active locale.
 *
 * @see {@link createTranslator}
 */
function t<T extends string>(source: T): string;
```

**Multiple `@see`** — each on its own line, alphabetical order by target name.

```ts
/**
 * Configures the doc-extractor plugin.
 *
 * @see {@link defineConfig}
 * @see {@link RichText}
 */
```

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

#### Banned implementation-detail patterns

Any of these in description or `@remarks` is a hard violation. The consumer of the public API never observes them at the call site; they belong in the code, not the docs.

| Pattern | Example violation | Why banned |
|---|---|---|
| **Environment checks** | "On the server, `typeof window !== 'undefined'` is false, so the subscriber is not registered." | Internal control flow — not part of the symbol's contract. |
| **Server vs client narration** | "On the client, reads track reactivity. On the server, no subscriber registers." | Same — the consumer reads a value, the rest is implementation. |
| **HTML / character-escape lists** | "Output is HTML-escaped (`&`, `<`, `>`, `\"`, `'`)." | Implementation. The symbol's name implies safe output; the consumer doesn't enumerate the escape set. |
| **Internal module / file mentions** | "Declares `@yapyak/react/internal` so the dev transform side-effect-imports it." | Internal wiring. Not part of the consumer surface. |
| **Compiler / transform / plugin internals** | "The compiler injects `useYapyak()` at the top of every function component containing `t()`." | Build-tool internals. |
| **Internal call sequences** | "When write is called, `setLocale` is invoked, which fires the trigger, which calls subscribers." | Restates code in prose. |
| **Cross-framework comparison** | "Slot content is developer-authored — quote your attributes, as with React, Vue, and Lit." | Off-topic, marketing-adjacent, irrelevant to this symbol. |
| **Documenting absence** | "Has no props." / "Returns nothing." | The signature already shows this. |
| **Pedagogical Web 101** | "Quote your attributes." / "Always escape user input." | Not API-specific. Belongs in a guide, not in API docs. |
| **Internal-variable names** | "Replaces every `CHILDREN_TOKEN` occurrence with the rendered children." | Internal symbol exposed in prose. |

Mechanical test before writing any `@remarks` sentence: **could a reader observe this from the public call site alone?** If no, omit. If yes but it duplicates the signature, omit. Only behavior that is consumer-visible AND non-derivable survives.

### Dedup — primary owns examples and remarks, secondaries reference

A primary symbol (function, component, hook, factory, class) and its secondary types (Options, Props, Result, Request, Response, Config, Event, Context) describe **one feature**. The feature's `@example` and `@remarks` live on **exactly one symbol** — the primary. Secondaries carry the formula sentence only.

**Mechanical rule:**

| Symbol role | Description | `@remarks` | `@example` |
|---|---|---|---|
| **Primary** (function, component, hook, factory, class) | Category formula | If triple-test passes | Required-or-optional per category |
| **Secondary** (`*Options`, `*Props`, `*Result`, `*Request`, `*Response`, `*Config`, `*Event`, `*Context`) | Suffix formula, with formula-slot `{@link Primary}` | **Never** | **Never** |

The formula-slot link in the secondary's description (`Options for {@link translate}.`, `Props for {@link RichText}.`) is the cross-reference. No additional `@see` is added — the primary is already linked structurally.

Duplicated `@example` or `@remarks` across primary and secondary is a hard violation. If you need to add a remark and you're inside the secondary's JSDoc, the remark belongs on the primary. Move it.

When **multiple primaries** consume the same secondary, the canonical lives on the primary that is the umbrella entry point (the one named most plainly, the one a user imports first). Other primaries link to it via the formula slot of their own return / option types where applicable.

```ts
// ✗ Wrong — duplication
/**
 * Renders rich text by binding each named tag to an Astro slot.
 *
 * @example
 * ```astro
 * <RichText value={t('Click <link>here</link>.')}>...</RichText>
 * ```
 */
export const RichText = ...;

/**
 * Props for {@link RichText}.
 *
 * @remarks
 * `value` carries the source string with named tags. Each tag is resolved by an Astro named slot...
 *
 * @example
 * ```astro
 * <RichText value={t('Click <link>here</link>.')}>...</RichText>
 * ```
 */
export type RichTextProps = { value: string };

// ✓ Right — primary owns the example, secondary is one line
/**
 * Renders rich text by binding each named tag to an Astro slot.
 *
 * @example
 * ```astro
 * <RichText value={t('Click <link>here</link>.')}>...</RichText>
 * ```
 */
export const RichText = ...;

/**
 * Props for {@link RichText}.
 */
export type RichTextProps = { value: string };
```

### Cross-framework sibling consistency

When the same conceptual symbol exists in multiple framework packages (e.g., `RichText` in `@yapyak/astro`, `@yapyak/react`, `@yapyak/svelte`, `@yapyak/vue`; `locale` in framework binding packages; `middleware` in adapter packages), their JSDoc is **mechanically parallel**.

**Sibling family** = the same conceptual export shared across two or more framework packages, identified by identical export name.

**Mechanical rules for a sibling family:**

1. **Identical summary template.** Same verb, same noun, same clause structure. The framework-specific term occupies one slot — that slot is the **only** difference.

   ```
   Renders rich text by binding each named tag to a [BINDING].
   ```

   Where `[BINDING]` per framework, closed set, mirrors Reactive binding kind table:

   | Framework | `[BINDING]` |
   |---|---|
   | Astro | named slot |
   | React | handler prop |
   | Solid | handler prop |
   | Svelte | snippet |
   | Vue | named slot |

2. **Identical `@remarks` policy.** Either all variants have `@remarks` or none do. If a remark applies to one but not all, audit whether the difference is real (then write a different remark per variant) or accidental (then remove or align).

3. **Identical `@example` shape.** Same scenario, same Yak Pool fixture, same tag names (`<link>...</link>` if one uses it, all use it), same surrounding prose-comment structure. Only framework-syntax differs:

   ```tsx
   // React
   <RichText value={t('Click <link>here</link>.')} link={(children) => <a href="/docs">{children}</a>} />

   // Svelte
   <RichText value={t('Click <link>here</link>.')}>
     {#snippet link(children)}<a href="/docs">{@render children()}</a>{/snippet}
   </RichText>

   // Vue
   <RichText :value="t('Click <link>here</link>.')">
     <template #link="{ children }"><a href="/docs"><component :is="children" /></a></template>
   </RichText>

   // Astro
   <RichText value={t('Click <link>here</link>.')}>
     <a slot="link" href="/docs"><RichText.Children /></a>
   </RichText>
   ```

   Number of `@example` blocks per sibling is identical across the family. Titles are identical across the family (or absent across the family).

4. **Identical secondary-type treatment.** `RichTextProps` exists in every framework package — every variant gets the same JSDoc form (formula sentence + formula-slot link to its `RichText`, no `@remarks`, no `@example`).

5. **Asymmetry must reflect actual code difference.** If one variant has type-safe per-tag props (React, Svelte via `PairsOf<T>` / `VoidsOf<T>`) and another doesn't (Astro, Vue with `value: string` only), the type signature already shows it — JSDoc says nothing extra. If one variant adds a sub-symbol (Astro's `RichText.Children`), document it on its own JSDoc — never in the parent's `@remarks`.

**Mechanical test before publishing a sibling family:**

Place all variants' JSDoc side-by-side. The summaries must be byte-identical except for the `[BINDING]` slot. The number of `@example` blocks must match. The number of `@param` / type-parameter lines must match where the type signature is parallel. Any unjustified asymmetry is a regression.

### Verify against code — strict

Every claim in JSDoc — summary, `@remarks`, `@param`, `@throws`, `@example` — must be traceable to a line of source code in the symbol's implementation or its callers. No claim is written from inference, naming, or guesswork.

**Before writing a JSDoc block:**

1. Read the symbol's implementation top to bottom.
2. Read at least one real call site (test or downstream usage).
3. If a behavior is only assumed (not observable in source), it does not appear in JSDoc.

**Banned shortcuts:**

- Inferring behavior from the symbol's name alone ("`createTranslator` so it must instantiate a Translator…") without reading the body.
- Copying language from a sibling symbol's JSDoc without verifying the same behavior is present here.
- Borrowing claims from external docs (`Intl.NumberFormat`, `React`, etc.) without confirming the symbol actually delegates to that primitive.
- Hand-wavy ranges ("returns roughly X", "usually Y") — if the bound isn't verifiable, drop it.

If the implementation cannot be read (binary dependency, generated code), stop and ask. Never publish unverified claims.

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

#### Inline comments inside example code — closed vocabulary

Only the following four comment forms appear inside example code. No others.

| Form | Use |
|---|---|
| `// => value` | Return / evaluated value. One space before `=>`. No column alignment. |
| `// error: <reason>` | Marks a line that fails to compile or throws at runtime. Promotes the block to a DiagnosticsBlock in the rendered docs. |
| `// ok: <reason>` | Positive verification marker. Same rendering as `error:`. |
| `// ...` | Elision when the example needs to gesture at code it does not show. |

Banned: explanatory comments (`// this calls format`), decorative separators (`// ---`), per-line narration (`// returns the price`), authorial asides. The example must read like working source. If a fact about the example isn't visible from the code + the four markers above, it doesn't belong in the example — move it to `@remarks` or rethink the API.

#### One scenario per `@example` block

Each `@example` block shows **one** scenario. A scenario is one usage pattern: basic call, error case, composition.

A block may show **variations of the same pattern** back-to-back (different inputs, same shape). Variation is not a new scenario.

```ts
// ✓ Right — variation of the same pattern
/**
 * @example Different styles
 * ```ts
 * format.number(199, { style: 'currency', currency: 'EUR' });
 * format.number(0.42, { style: 'percent' });
 * format.number(45, { style: 'unit', unit: 'kilometer' });
 * ```
 */

// ✗ Wrong — two scenarios in one block (wrapping helper + lookup record)
/**
 * @example
 * ```ts
 * function setPrice(amount: number, currency: Currency) { ... }
 * setPrice(199, 'USD');
 *
 * const prices: Record<Currency, number> = { SEK: 199, USD: 19 };
 * ```
 */
```

#### Maximum 3 `@example` blocks per symbol

Cap at **3**. Pick the 3 most distinct scenarios. More than 3 signals the symbol has too many modes — fix the API, not the docs.

Exception: an umbrella symbol with structurally distinct call forms (positional vs object args, sync vs async, chained variants like `t.in()` / `t.as()`) may have one block per call form, capped at **5**.

#### First example — no title, simplest form

The first `@example` block of any symbol has **no title** and shows the **simplest possible invocation**. Subsequent blocks carry verb-phrase titles. A symbol with a single block also goes title-less.

```ts
// ✓ Right
/**
 * @example
 * ```ts
 * t('Save changes');
 * ```
 *
 * @example Forced locale at the call site
 * ```ts
 * t.in('sv', 'Welcome back, {name}!', { name: 'Alex' });
 * ```
 */
```

#### Whitespace inside example body

- **One blank line** between imports and the body. Always.
- **No other blank lines** inside the body — variations of the same pattern stack consecutively.

```ts
// ✓ Right
/**
 * @example
 * ```ts
 * import { format } from 'yapyak';
 *
 * format.number(199, { style: 'currency', currency: 'EUR' });
 * format.number(0.42, { style: 'percent' });
 * ```
 */
```

#### Identifier names inside examples — consistent within a symbol

Across all `@example` blocks for the **same** symbol, the same concept uses the same identifier. If example 1 names the input `amount`, example 3 uses `amount` — never silently renamed mid-symbol. Fixture values still come from the Yak Pool ([[testing]] § Test voice); identifier names follow the API's natural domain term.

#### Composition examples

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

The identifier is the human form of the package name; the role determines the summary suffix. The set `adapter`, `base`, `bindings`, `plugin`, `translator` is closed — adding a new role requires amending this table before any package uses it.

`bindings` covers client-side framework-native runtime glue (hooks, refs, runes, native components). `adapter` covers server-lifecycle wiring (middleware, handle, withRequest). `plugin` covers build-tool plugins. `translator` covers LLM-vendor implementations.

| Package | Identifier | Role |
|---|---|---|
| `@yapyak/anthropic` | Anthropic | translator |
| `@yapyak/astro` | Astro | bindings |
| `@yapyak/gemini` | Gemini | translator |
| `@yapyak/ollama` | Ollama | translator |
| `@yapyak/openai` | OpenAI | translator |
| `@yapyak/react` | React | bindings |
| `@yapyak/react-router` | React Router | adapter |
| `@yapyak/svelte` | Svelte | bindings |
| `@yapyak/sveltekit` | SvelteKit | adapter |
| `@yapyak/tanstack-start` | TanStack Start | adapter |
| `@yapyak/vite` | Vite | plugin |
| `@yapyak/vue` | Vue | bindings |

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
15a. ≤ 3 `@example` blocks (≤ 5 for umbrella symbols with structurally distinct call forms).
15b. First `@example` carries no title, shows the simplest invocation.
15c. Each `@example` shows one scenario; multiple scenarios use multiple blocks.
15d. Comments inside example code use only the closed vocabulary: `// =>`, `// error:`, `// ok:`, `// ...`.
15e. One blank line between imports and body; no other blank lines inside the body.
15f. Identifier names consistent across same-symbol example blocks.
16. `@typeParam` for every type parameter, alphabetical.
17. `@throws` for every non-trivial exception type.
18. `{@link}` used for in-project public symbols; backticks for literals, third-party, internal.
18a. No `{@link X}` or `@see {@link X}` to a target already structurally linked on the same rendered page (Type column, Param-type, Returns, formula-slot).
18b. Inline `{@link}` in description prose only when the link occupies a formula-slot from the closed set.
18c. `@see` blocks alphabetical by target name.
19. `@deprecated` always includes migration path.
20. `@remarks` adds actionable nuance, not decorative facts.
20a. `@remarks` contains no banned implementation-detail patterns (environment checks, server/client narration, escape-char lists, internal modules, compiler/transform internals, internal call sequences, cross-framework comparison, documenting absence, Web 101, internal-variable names).
20b. Every claim in description / `@remarks` / `@param` / `@throws` is verified against the symbol's implementation or a real call site.
20c. Secondary types (`*Options`, `*Props`, `*Result`, `*Request`, `*Response`, `*Config`, `*Event`, `*Context`) carry **no** `@remarks` and **no** `@example` — those live on the primary symbol only.
20d. No `@example` or `@remarks` text duplicated between a primary and its secondaries (or between sibling symbols in the same domain).
20e. Cross-framework sibling families (`RichText`, `locale`, `middleware`, etc.) have byte-identical summaries except for the framework-specific binding slot, identical `@example` shape/count/titles, and identical secondary-type treatment.
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
