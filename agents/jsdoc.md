## JSDoc

TSDoc (Microsoft's TypeScript-aware spec) on public API symbols only — generation algorithm, category formulas, tag rules.

### Prime directives

These two rules outrank everything else. When a formula, catalog entry, or "should be present" instruction conflicts with them, they win.

**1. Omit before vague.**

If a fact cannot be stated mechanically (per a formula, the standard-phrasings catalog, or a verified observation from source) and briefly, it does not appear. Empty is better than padded.

- Drop the second sentence rather than reach for "usually", "typically", "often", "may", "roughly".
- Drop the `@remarks` rather than fill it.
- Drop the `@example` rather than fabricate a scenario.
- Drop the `@throws` rather than restate the type signature.

A symbol with only a single-sentence category-formula summary is a complete, passing JSDoc block.

**2. Every claim is verified against actual source code.**

Every word in description, `@remarks`, `@param`, `@throws`, `@example`, and `@see` corresponds to a line of code that was read for this block. No claim is written from:

- The symbol's name alone.
- A sibling symbol's JSDoc.
- External documentation of a delegated primitive (`Intl.NumberFormat`, `React`) without confirming the delegation.
- Inference from the call signature.

If implementation cannot be read end-to-end, the JSDoc stops at what the signature alone can support.

### Generation algorithm

```
0.  Verify against code. Read the implementation; search for callers and tests.
1.  Determine kind: function / type / interface / const / property.
2.  Apply category decision tree → category + formula.
3.  Look up name in the Qualifier table — prepend qualifier if matched.
4.  Apply Acronyms table to the formula's filled slots.
5.  Write summary using the formula (≤ 100 chars, period, 3rd-person indicative).
6.  Add second sentence ONLY if the name is opaque per the trigger list.
7.  Add @remarks ONLY if actionable nuance exists. Otherwise omit.
8.  List @typeParam tags (alphabetical).
9.  List @param tags in signature order — names match exactly, hyphen separator.
10. Add @defaultValue (properties only).
11. Add @throws per non-trivial exception type.
12. Add @example if the category requires one.
13. Run the pre-publish audit checklist.
```

### Worked example

`createTranslator()`:

1. Kind: function.
2. Category: name starts with `create*`, returns new instance → Factory.
3. Qualifier: not listed.
4. Formula: `Creates a [T] [minimal-context].` → `Creates a translator.`
5. Acronyms: none.

### Scope — what gets JSDoc

| Visibility | JSDoc |
| --- | --- |
| Public (re-exported from `src/index.ts`) | Full block. No exceptions. |
| Cross-package semi-public (re-exported from `src/internal.ts`) | None. |
| Intra-package semi-public (domain barrel only) | None. |
| Private (not re-exported) | None. |
| Tests | None. |

Type-only symbols on the public surface follow the same rule as functions.

### Tag categories

TSDoc groups tags into three categories. The category dictates placement.

| Category | Placement | Examples |
|---|---|---|
| **Modifier** | Standalone line, before description | `@public`, `@beta`, `@alpha`, `@deprecated`, `@override`, `@sealed` |
| **Block** | After description, separate paragraphs | `@param`, `@throws`, `@remarks`, `@example`, `@see`, `@defaultValue`, `@typeParam` |
| **Inline** | Embedded within prose using `{@tag content}` | `{@link Symbol}`, `{@inheritDoc Symbol}` |

### Canonical tag order

```
@public | @beta | @alpha | @experimental    ← release stage (one only, optional)
@deprecated [+ migration path]               ← optional
[summary — single sentence, period]

@remarks
[longer prose — only when summary needs expansion]

@shape <inline signature override>           ← rendering-only
@typeParam T - description                   ← generics, alphabetical
@param name - description                    ← signature order
@defaultValue [value]                        ← for properties only
@throws {ErrorClass} when [condition]
@see {@link OtherSymbol}                     ← only when target not structurally linked
@example [optional title]                    ← required for categories; ≤ 3 blocks
  ```ts
  // code
  ```
```

Empty lines separate the summary, `@remarks`, and each tag block. Inside a tag group (consecutive `@param` lines), no blank lines.

### Description rules

- **Summary line:** one sentence, sentence-case capital at start, period at end. Hard limit 100 characters. Overflow goes in `@remarks`.
- **No hard-wrapping.** Each paragraph is a single physical line. Long lines are fine; the editor soft-wraps.
- **3rd-person indicative.** Descriptions describe what the symbol *is* or *does*. Never imperative directions to the reader.
- **Present tense, active voice.** No future ("will"), no passive.
- **No second-person pronouns.** Never "your", "yours", "you". Use article + noun.
- **No arbitrary domain elaboration in summaries.** Summary must be derivable from the symbol's name + category + immediate type signature alone. Product-name detail goes in `@remarks`.

  - ✗ "Creates a translator backed by the OpenAI Chat Completions API."
  - ✓ "Creates an OpenAI translator."

- **All `@remarks` content ends with period.** Each sentence is a full sentence.
- **Defaults live only in `@defaultValue`.** Never "(default: X)" or "Defaults to X." in prose.
- **Parallelism in sibling descriptions.** Multiple items at the same level follow the same shape, same verb, same length-tier.
- **Normal English prose only.** No telegraphic labels joined by semicolons. No hyphen-stitched jargon-adjectives.
- **Backticks** around code identifiers, types, values, file paths: `t()`, `string`, `null`, `'cookie'`, `package.json`.
- **Banned verbs:** "gets", "sets", "gets or sets".
- **Banned adverbs:** "simply", "just", "easily", "automatically".
- **Banned em-dash (`—`) in description prose.** Use period, colon, parentheses, or rewrite. Applies to description prose before the first `@tag`. `@remarks`, `@example`, other tag bodies unaffected.
- **No redundant subject:** "The type." not "The type of this attribute."
- **Reference other symbols with `{@link}`** — never restate what they are.

#### `{@link}` vs backticks — mechanical rule

| Symbol kind | Form |
|---|---|
| Public symbol in the same project | `{@link Symbol}` |
| Third-party type, literal value, internal-only symbol, file path, string literal | `` `value` `` |

Examples: `{@link Translator}`, `{@link createTranslator}`. But: `` `null` ``, `` `'cookie'` ``, `` `Promise<T>` ``.

### Qualifier table

Polysemous property names take a domain qualifier. Fixed per property name.

| Property name | Qualifier |
|---|---|
| `method` | HTTP |
| `status` | HTTP |

The formula's `[name]` slot expands to `[qualifier] [name]`. If a property is named `status` but isn't HTTP-related, rename the property — never override the qualifier.

### Function category formulas

Apply the decision tree top-down. First match wins.

| Signal | Category | Formula |
|---|---|---|
| Name `is*` / `has*` / `can*` / `should*` and returns `boolean` | Predicate | "Whether [subject] [predicate]." |
| Return type `x is T` | Type guard | "Type guard — narrows [X] to [T] when [condition]." |
| Name `use*`, returns hook value | Hook | "[Verb-phrase action of the hook]." |
| Name PascalCase, returns JSX/ReactElement | Component | "Renders [what]." |
| Name `create*` / `make*`, returns new instance | Factory | "Creates a [T] [minimal-context]." |
| Name is a brand / provider / source identifier (lowercase function), returns T | Provider factory | "Creates [an\|a] [CapitalizedName] [T]." |
| Name `find*` / `lookup*`, returns `T \| undefined` | Finder | "Finds [what] by [key]. Returns `undefined` if [condition]." |
| Name `parse*` | Parser | "Parses [input] into [output]." |
| Name `validate*` / `check*`, throws on failure | Validator | "Validates [target]. Throws if [condition]." |
| Name `to*` / `from*`, pure transform | Converter | "Converts [from] to [to]." |
| Returns `Promise<T>` | Async | (apply base category) + "Resolves to [value]." |
| Side effects, returns `void` or mutated value | Mutator | "[Verb] [target]." |
| Name starts with an imperative verb from the Action verb list | Action | "[Verbs-3p] [target]." |
| Name `with*`, takes a value and a `fn` callback | Scope binder | "Runs `fn` with [value] bound to [scope]." |
| Const named `middleware` / `handle` / `integration` with host-framework type | Host integration | "[Capitalized symbol-name] for [package identifier]. Provides yapyak's per-request locale context." |
| Const exported as a framework-specific reactive primitive | Reactive binding | "Reactive [identifier] [binding-kind]." |
| Otherwise (returns derived value, noun-named) | Getter | "The [thing]." |

#### Action verb list

Closed set. Extend before coining. Tested case-insensitively against the camelCase first word.

```
apply, build, compile, decode, detect, discover, dispatch, emit, encode,
extract, fetch, format, generate, load, merge, migrate, normalize, read,
register, render, resolve, run, save, send, sync, transform, walk, write
```

`[Verbs-3p]` = first camelCase word with `s` appended.

`[target]` = the function's output noun, verified against the implementation. Never derived from the function name alone — `extractFile` extracts *messages from* a file, not "a file".

#### Reactive binding kind table

| Framework | `[binding-kind]` |
|---|---|
| React | hook |
| Solid | signal |
| Svelte | store |
| Vue | ref |

The `[identifier]` slot is the symbol name verbatim.

### Type / interface category formulas

Suffix-driven, matches the type suffix vocabulary in [[naming]].

| Suffix | Formula |
|---|---|
| `*Options` | "Options for [function]." |
| `*Input` | "Input for [function]." |
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

For inline-union types (no name), put the JSDoc on the field that holds the union per [[types]] § Union types — inline vs named.

### Type / interface — deterministic first sentence

When no suffix formula applies:

1. Known suffix → use suffix formula.
2. Callable interface (function-like) → use function-category formula.
3. Otherwise:
   - **First sentence:** `The [name-as-noun-phrase].` — PascalCase to spaced lowercase. Always.
   - **Second sentence — REQUIRED when:**
     - Name ends with discriminator suffix: `Level`, `Mode`, `Kind`, `Type`, `Tag`, `Group`.
     - Name is a generic placeholder used standalone: `Result`, `Config`, `State`, `Context` without contextual prefix.
     - Name resolves to ≤ 1 substantive word after PascalCase split.
   - **Second sentence — OPTIONAL otherwise.** Omit unless an actionable behavior-clause genuinely adds information.
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
export type MessageContext = { /* ... */ };

// ✓ Translator — callable interface, use function-category formula
/**
 * Translates source strings into target locales.
 */
export type Translator = (request: TranslateRequest) => Promise<string>;
```

**Name-restate rules:**

- PascalCase → spaced lowercase: `ContextLevel` → "context level".
- Acronyms preserved per Acronym table: `APIKeyConfig` → "API key config".
- Verb-formed nouns kept as-is: `TranslateItem` → "translate item".
- First article is always `The` (except `*Entry` / `*Item` which use `A`/`An`).

### `@param` rules

- **Verification.** Read the parameter's use site before writing its description.
- **Format:** `@param name - description` — required hyphen separator per TSDoc.
- **No types in `@param`.** TypeScript already has the type.
- **Every parameter gets a description.** No exceptions.
- **Order matches the signature exactly.**
- **Required vs optional** is implicit from the `?` in the signature, not stated in the description.
- **One paragraph per `@param`.**

```ts
// ✓
/**
 * Creates a translator from the given options.
 *
 * @param options - The translator configuration.
 */
function createTranslator(options: TranslatorOptions): Translator;
```

### `@param` description patterns

| Pattern | Formula | Example |
|---|---|---|
| Boolean — state predicate | "Whether [subject] is/has [adjective]." | "Whether the attribute is filterable." |
| Boolean — behavior flag | "Whether to [verb-phrase]." | "Whether to detect locale from `Accept-Language`." |
| Boolean (auto-detect) | "Whether [subject]. If `undefined`, auto-detected from [source]." | "Whether the value can be `null`. If `undefined`, auto-detected from column constraint." |
| Value | "The [thing]." | "The locale code." |
| Value (auto-detect) | "The [thing]. If `undefined`, auto-detected from [source]." | "The type. If `undefined`, auto-detected from the source." |
| Callback | "Called when [event]." | "Called when the locale changes." |
| Options bundle | "Options bundle. See {@link OptionsType}." | "Options bundle. See {@link TranslatorOptions}." |

**State predicate vs behavior flag:** matches the boolean-naming rule in [[naming]]. A field named with a bare adjective is state. A field named with a verb-phrase is behavior. Description form must match field-name form.

### Options interface field order — alphabetical

- Fields are alphabetical by name.
- `?` (optional marker) is NOT a sort key.
- **Single exception:** in tagged unions, the discriminator field comes first per variant. All other fields alphabetical.

```ts
// ✓
type YapyakOptions = {
  defaultLocale?: string;
  detectUserLocale?: boolean;
  exclude?: FilterPattern;
  include?: FilterPattern;
  localesDir?: string;
  persistence?: PersistenceConfig;
  syncHtmlLang?: boolean;
  translator?: Translator;
};

// ✓ — discriminator first per variant
type Shape =
  | { type: 'circle'; radius: number }
  | { type: 'square'; side: number };
```

Positional function parameters keep signature order. Alphabetical only inside object field lists.

### `@returns` — banned

`@returns` is forbidden. Return values are documented by the type signature alone.

If a function's return value genuinely needs explanation, the explanation goes in the summary or `@remarks`. The renderer produces no "Returns" section.

```ts
// ✗
/**
 * @returns The locale that was actually applied, after fallback resolution.
 */
function setLocale(locale: string): string;

// ✓ — return semantics in the summary
/**
 * Sets the active locale. The applied locale may differ from the input after fallback resolution.
 */
function setLocale(locale: string): string;
```

### `@defaultValue`

For properties with a default. Goes after `@param`, before `@throws`.

```ts
type YapyakOptions = {
  /**
   * Glob patterns to include for extraction.
   *
   * @defaultValue `['**\/*.{ts,tsx}']`
   */
  include?: FilterPattern;
};
```

### `@throws`

- Required when the function throws a non-trivial error.
- Format: `@throws {ErrorClass} when [condition]`
- One block per exception type.

```ts
/**
 * @throws {DynamicSourceError} when the source argument is not a string literal.
 * @throws {ParseError} when the file cannot be parsed.
 */
```

### `@typeParam`

Required when the type parameter is part of the public contract. Format: `@typeParam T - description`.

- One block per type parameter, alphabetical.
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

Always include a migration path. Never a bare `@deprecated`.

```ts
// ✓
/**
 * @deprecated Use {@link createTranslator} instead.
 */
export function makeTranslator(): Translator;
```

For longer migration guidance:

```ts
/**
 * @deprecated Use {@link createTranslator} with `voice` option.
 * The old `voice()` setter was removed in 2.0.
 */
```

### `{@link Symbol}` and `@see` — when to link

The rendered reference page already links every type in the Type column, every parameter type in the Param table, the Return type, and any formula-slot link in the summary. Do not duplicate those.

**Step 1 — is the target already structurally linked on this page?**

| Where target already appears | Then |
|---|---|
| Type column, Param-type column, Returns row, or formula-slot `{@link}` in the summary | No link in prose. No `@see`. |
| Nowhere on this page | Continue to Step 2. |

**Step 2 — when an external link IS needed, pick form mechanically.**

| Link role | Form |
|---|---|
| Link **is** the description subject (formula-slot) | Inline `{@link X}` |
| Genuine cross-reference to a different concept | `@see {@link X}` block |

**Formula slots with an inline `{@link}`** — closed set:

- `Props for {@link Component}.`
- `Options for {@link function}.`
- `Input for {@link function}.`
- `Result of {@link function}.`
- `Request shape for {@link endpoint}.`
- `Response shape for {@link endpoint}.`
- `Returned by {@link X}.`
- `Created by {@link X}.`
- `Equivalent to {@link X}.`
- `Discriminator for {@link Union}.`

Outside the formula-slot set, links never appear inside description prose.

**Multiple `@see`** — each on its own line:

1. External links first, alphabetically by displayed label.
2. Internal links second, alphabetically by displayed label.

External = absolute URL (`http://` or `https://`). The two groups never interleave.

#### Internal `@see` — peer-pair rule

A symbol gets `@see {@link Peer}` if and only if it shares a closed-set peer-pair relationship with another public symbol from the same module.

| Pair prefix | Operational meaning |
|---|---|
| `get*` / `set*` | Read / write the same value |
| `get*` / `reset*` | Read / restore the same value |
| `set*` / `reset*` | Write / restore the same value |
| `subscribe*` / `get*` | Observe / read the same value |
| `parse*` / `stringify*` | Decode / encode the same shape |

**Algorithm:**

1. Take the symbol's name.
2. Strip its leading prefix if it matches `get`/`set`/`reset`/`subscribe`/`parse`/`stringify` — call the remainder the root noun.
3. For every OTHER prefix in the table, check whether `<otherPrefix><RootNoun>` exists as a public symbol in the same module.
4. For each match, the symbol carries `@see {@link <otherPrefix><RootNoun>}`.

**Symmetry enforced:** if A carries `@see {@link B}`, then B carries `@see {@link A}`.

#### Internal `@see` — target-family rule

A type T carries `@see` entries for every function in the same module whose name follows a target-family prefix pattern against T.

| Function name pattern | Relationship to T |
|---|---|
| `create<T>` | Factory that returns T |
| `get<T>` | Reads the current T |
| `set<T>` | Writes T (parameter type) |
| `reset<T>` | Restores T to default |
| `is<T>` | Type guard narrowing to T |
| `parse<T>` | Parser that returns `T \| undefined` |

The reverse direction is NOT auto-added.

```ts
/**
 * The locale. Holds a BCP 47 language tag.
 *
 * @see {@link getLocale}
 * @see {@link isLocale}
 * @see {@link parseLocale}
 * @see {@link setLocale}
 * @see [BCP 47](https://datatracker.ietf.org/doc/html/bcp47)
 */
export type Locale = ...;
```

#### No other internal `@see` cases

If a relationship is not in the peer-pair table or the target-family table, navigation belongs in the sidebar or in formula-slot `{@link X}` inline — not in `@see`.

#### Parent / member navigation is auto-generated

When a public symbol has documented members that render as their own pages (`format.number`, `t.in`), the renderer auto-injects a "See also" section listing the parent symbol and every sibling. Authors do not write `@see {@link parent}` or `@see {@link parent.sibling}` for namespace navigation.

#### External standard references — MDN / ISO / RFC / Wikipedia

When a public type structurally wraps a Web Platform / Intl / ECMA / DOM type, or when the description names a specific ISO standard or RFC, link to its canonical spec via `@see <URL>`.

**Mechanical triggers:**

| Trigger | Canonical URL host |
|---|---|
| Type uses `Omit<Intl.X, ...>`, `Pick<Intl.X, ...>`, `Intl.X & { ... }`, `extends Intl.X` | `developer.mozilla.org` |
| Description names ISO standard (`ISO 4217`, `BCP 47`) | `www.iso.org` |
| Description names RFC by number (`RFC 7231`) | `datatracker.ietf.org` |
| Description names a Wikipedia concept | `en.wikipedia.org` |

Using a Web built-in as a parameter or return type does NOT trigger this — only structural wrapping.

**Format:** `@see [Label](URL)`. The label is mandatory. In-project `@see {@link X}` blocks first, external second.

```ts
/**
 * The currency. Holds an ISO 4217 currency code.
 *
 * @see [ISO 4217](https://www.iso.org/iso-4217-currency-codes.html)
 */
export type Currency = 'AED' | ...;
```

**Canonical label per source:**

| Source | Label form |
|---|---|
| MDN | Bare symbol or namespace path. `Intl.DateTimeFormat`, `Response`, `URL`. |
| ISO | `ISO NNNN`. `ISO 4217`. |
| IETF RFC | `RFC NNNN`. `RFC 7231`. |
| IETF BCP | `BCP NN`. `BCP 47`. |
| Wikipedia | Page title verbatim. |

**MDN URL rules:**

- Always `https://developer.mozilla.org/en-US/...`.
- Point to the `<Type>/<Type>` constructor page (where the options table lives).
- No fragments unless the page has no other landing for the option set.

### `@remarks`

The summary is one sentence. Anything longer goes in `@remarks`. Summary shows up in IDE quick-info; `@remarks` only renders in full-page documentation.

#### Triple test

A behavior detail belongs in `@remarks` only when all three:

1. **Unique** — specific to this symbol, not shared with siblings.
2. **Actionable** — the consumer must act on it.
3. **Not derivable** — summary, signature, name, category formula do not convey it.

If even one fails, omit.

| Do | Don't |
|---|---|
| Behavioral caveats ("Notifies subscribers in registration order.") | Restatement of what the name already conveys. |
| Performance characteristics ("Memoized per source string.") | Decorative single facts ("Backed by the X API."). |
| When-to-use vs when-not-to-use | Marketing-flavored prose. |
| Mental model context ("Re-renders descendants when the locale changes.") | "This is useful for…" without naming the case. |

#### No code blocks in `@remarks`

Code belongs in `@example`. `@remarks` is prose only — no fenced code blocks, no inline multi-line snippets. Inline backticks for token names are fine.

#### Configuration prerequisites

Host config flags and environment-variable requirements use a fixed form:

```
Requires `[flag]` in `[file]`.
```

Examples: `` Requires `future.v8_middleware: true` in `react-router.config.ts`. ``, `` Requires `YAPYAK_API_KEY` in the environment. ``

#### Framework versions never appear in JSDoc

Host-framework version requirements live in `package.json` `peerDependencies` only.

#### Banned implementation-detail patterns

Any of these in description or `@remarks` is a violation.

| Pattern | Example | Why banned |
|---|---|---|
| **Environment checks** | "On the server, `typeof window !== 'undefined'` is false." | Internal control flow. |
| **Server vs client narration** | "On the client, reads track reactivity." | Implementation. |
| **HTML / character-escape lists** | "Output is HTML-escaped (`&`, `<`, `>`)." | Implementation. |
| **Internal module mentions** | "Declares `@yapyak/react/internal` so the dev transform side-effect-imports it." | Internal wiring. |
| **Compiler / transform internals** | "The compiler injects `useYapyak()` at the top." | Build-tool internals. |
| **Internal call sequences** | "When write is called, `setLocale` is invoked, which fires the trigger." | Restates code. |
| **Cross-framework comparison** | "Slot content is developer-authored — as with React, Vue, and Lit." | Off-topic. |
| **Documenting absence** | "Has no props." / "Returns nothing." | Signature shows it. |
| **Pedagogical Web 101** | "Quote your attributes." | Not API-specific. |
| **Internal-variable names** | "Replaces every `CHILDREN_TOKEN`." | Internal symbol. |

**Test:** could a reader observe this from the public call site alone? If no, omit.

### Dedup — primary owns examples and remarks

A primary symbol (function, component, hook, factory, class) and its secondary types (Options, Props, Result, Request, Response, Config, Event, Context) describe one feature. The feature's `@example` and `@remarks` live on the primary. Secondaries carry the formula sentence only.

| Symbol role | Description | `@remarks` | `@example` |
|---|---|---|---|
| **Primary** | Category formula | If triple-test passes | Required-or-optional per category |
| **Secondary** (`*Options`, `*Props`, `*Result`, `*Request`, `*Response`, `*Config`, `*Event`, `*Context`) | Suffix formula, with formula-slot `{@link Primary}` | Never | Never |

```ts
// ✓ — primary owns the example, secondary is one line
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

When multiple primaries consume the same secondary, the canonical lives on the umbrella primary.

### Cross-framework sibling consistency

When the same conceptual symbol exists in multiple framework packages (`RichText` in `@yapyak/astro`, `@yapyak/react`, `@yapyak/svelte`, `@yapyak/vue`), their JSDoc is mechanically parallel.

**Rules for a sibling family:**

1. **Identical summary template.** The framework-specific term occupies one slot — the only difference.

   ```
   Renders rich text by binding each named tag to a [BINDING].
   ```

   | Framework | `[BINDING]` |
   |---|---|
   | Astro | named slot |
   | React | handler prop |
   | Solid | handler prop |
   | Svelte | snippet |
   | Vue | named slot |

2. **Identical `@remarks` policy.** Either all variants have it or none do.
3. **Identical `@example` shape.** Same scenario, same Yak Pool fixture, same tag names, same surrounding prose-comment structure.
4. **Identical secondary-type treatment.** Same JSDoc form across the family.
5. **Asymmetry must reflect actual code difference.**

**Test before publishing a sibling family:** place all variants' JSDoc side-by-side. Summaries must be byte-identical except for the `[BINDING]` slot.

### `@example`

- **Required for:** hooks, factories with non-trivial flow, provider factories, async functions, type guards with non-trivial narrowing, builders, callbacks-as-args.
- **Optional for:** predicates, simple converters, getters, components with obvious props.
- **Code must be runnable.**
- **No trailing commas.** Mechanical: if the next non-whitespace character is `}`, `]`, or `)`, the preceding comma is trailing → remove it. Applies to every example block.
- **Always include imports.** Every `@example` ships the necessary `import` statements.
- **Parallel import forms.** When showing the project's symbol alongside a placeholder for a sibling symbol, both imports use the same form.

  ```ts
  import { middleware as yapyakMiddleware } from 'yapyak/adapter/astro';
  import { middleware as authMiddleware } from './auth';   // ✓ mirrors shape
  // import { authMiddleware } from './auth';              // ✗
  ```

- **No placeholder identifiers.** Pull from the Yak Pool in [[testing]].
- **Return values:** show with `// output:`.
- **Code-block language identifier:**

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

- **Title format:** verb-phrase use case (`Per-request locale in TanStack Start`). Omit title for a single trivial example.
- **Titles are plain text** — no markdown, no backticks, no HTML/JSX, no braces. Code, tag names, identifiers belong inside the code block.

  Forbidden in titles:

  | Pattern | Violation | Rewrite |
  |---|---|---|
  | Backticks | `` @example Render with `link` tag `` | `@example Render with link tag` |
  | HTML/JSX tags | `@example Render a `<link>` tag` | `@example Render a link tag` |
  | Curly braces | `@example Set t({ count: 2 })` | `@example Set t with count` |
  | File paths in backticks | `` @example Re-export from `src/middleware.ts` `` | `@example Re-export from src/middleware.ts` |

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

Multiple `@example` blocks order: lowest argument count first → increasing complexity → framework-specific last.

#### Inline comments inside example code — closed vocabulary

Only four comment forms appear inside example code.

| Form | Use |
|---|---|
| `// output: <value>` | Return / evaluated value. Promotes to OutputBlock in rendered docs. |
| `// error: <reason>` | Marks a line that fails to compile or throws at runtime. Promotes to DiagnosticsBlock. |
| `// ok: <reason>` | Positive verification marker. Same rendering as `error:`. |
| `// ...` | Elision when the example needs to gesture at code it does not show. |

**`// output:` has two forms** — pick the cleaner per case:

```ts
// Inline — single value or short multi-line
getLocale(); // output: 'sv'

// Bare header + continuation — multi-locale output
format.number(199, { style: 'currency', currency: 'EUR' });
// output:
// en-US: '€199.00'
// sv-SE: '199,00 €'
// de-DE: '199,00 €'
```

Banned: explanatory comments, decorative separators, per-line narration, authorial asides.

#### One scenario per `@example` block

A block may show variations of the same pattern back-to-back (different inputs, same shape). Variation is not a new scenario.

```ts
// ✓
/**
 * @example Different styles
 * ```ts
 * format.number(199, { style: 'currency', currency: 'EUR' });
 * format.number(0.42, { style: 'percent' });
 * format.number(45, { style: 'unit', unit: 'kilometer' });
 * ```
 */
```

#### Maximum 3 `@example` blocks per symbol

Cap at 3. More than 3 signals the symbol has too many modes.

**Exception:** an umbrella symbol with structurally distinct call forms (positional vs object args, sync vs async, chained variants) may have one block per call form, capped at 5.

#### First example — no title, simplest form

The first `@example` block of any symbol has no title and shows the simplest possible invocation. Subsequent blocks carry verb-phrase titles.

#### Whitespace inside example body

- One blank line between imports and body.
- No other blank lines inside the body.

#### Identifier names — consistent within a symbol

Across all `@example` blocks for the same symbol, the same concept uses the same identifier. Fixture values still come from the Yak Pool; identifier names follow the API's natural domain term.

#### Composition examples

Composition / "use with other things" examples are justified only when:

1. The composition mechanism is non-obvious, AND
2. The composition has a canonical pattern the consumer is expected to follow, AND
3. There is no plain-language way to convey it in `@remarks` alone.

If composition reduces to "add to the array" or "spread into the config", drop the example.

If composition has a caveat (ordering matters, state interactions), add a `@remarks` block describing the constraint before the compose `@example`.

### `@packageDocumentation`

Required at the top of the public entry file. Documents the package itself. Not required on the `/internal` entry file.

#### Canonical shape

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

- Heading is literally `## Installation`.
- Code fence language is `bash`. Never `shell`, `sh`, or omitted.
- Two-line install block: `npm install …` line 1, `# or` line 2, `pnpm add …` line 3.
- Package name matches `package.json` `name` field verbatim.

#### Summary formula

The identifier is the human form of the package name (scope stripped, dashes to spaces, project's display casing).

| Category | Test | Formula |
|---|---|---|
| Foundation | Identifier matches a sibling's role | `[Identifier] base for [project].` |
| Role-less | No sibling has the identifier as a role | `[Identifier] for [project].` |
| Role-bearing | Package has an explicit role | `[Identifier] [role] for [project].` |

#### Package identifier and role table

Closed set: `adapter`, `base`, `bindings`, `plugin`, `translator`.

`bindings` — client-side framework-native runtime glue (hooks, refs, runes, native components).
`adapter` — server-lifecycle wiring (middleware, handle, withRequest).
`plugin` — build-tool plugins.
`translator` — LLM-vendor implementations.

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

The root `yapyak` package summary is hand-authored.

**Banned in summaries:**

| Class | Examples |
|---|---|
| Adjectives | `basic`, `core`, `low-level`, `main`, `reactive`, `shared`, `simple` |
| Filler nouns | `binding`, `entry`, `entry point`, `helpers`, `primitives`, `runtime`, `toolkit` |
| Marketing verbs | `Enables`, `Exposes`, `Powers`, `Provides`, `Wraps` |
| Cross-references | `{@link}` — covered by the Exports table |
| Listing | Enumerating exports |

### Release stage tags

Default: do not use release-stage tags. Implicit publicness via "exported from entry = public" works for stable libraries.

If a project explicitly tracks API maturity:

| Tag | Meaning | Strip with api-extractor? |
|---|---|---|
| `@public` | Stable, part of the public API. | No |
| `@beta` | Released for feedback, may change. | Optional |
| `@alpha` | Unstable, internal preview. | Optional |
| `@experimental` | Same as `@beta`, for tools without `@alpha`. | Optional |

### Acronyms

Project acronyms declared in [[testing]] § Lexical rules. TypeScript-specific additions:

```
AMD, CJS, CSR, ESM, HMR, ISR, JSX, SPA, SSR, TSX, UMD
```

Apply case-insensitive after any description formula.

### Sync rule

When a public API signature changes — parameter renamed, type changed, behavior changed — JSDoc updates in the same commit.

When renaming a referenced symbol: every `{@link OldName}` becomes `{@link NewName}` in the same commit.

### Whitespace inside a JSDoc block

Each block tag group is separated by an empty line. Items within a group are consecutive.

```
[summary]
                       ← empty line
@remarks
[remarks prose]
                       ← empty line
@typeParam T - ...
@typeParam U - ...     ← consecutive
                       ← empty line
@param a - ...
@param b - ...         ← consecutive
                       ← empty line
@defaultValue ...
                       ← empty line
@throws {Err} when ...
                       ← empty line
@example
[example code]
```

### Standard phrasings

Pick from this catalog rather than inventing.

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

If no row fits, write the most boring possible declarative sentence.

### Pre-publish audit checklist

For every public API symbol:

1. JSDoc block present.
2. Summary ≤ 100 chars, one sentence, period at end, capital at start.
3. Summary is 3rd-person indicative.
4. Category formula applied.
5. Second sentence present only when name triggers it.
6. Acronyms uppercase.
7. `@param` matches signature order AND names exactly.
8. `@param` uses hyphen separator, no types.
9. Boolean fields use correct shape: `Whether [subject] is/has [adjective].` (state) or `Whether to [verb-phrase].` (behavior).
10. Options-type fields alphabetical (discriminator first in union variants).
11. No `@returns` block.
12. `@example` present for required categories.
13. `@example` includes imports.
14. `@example` language identifier is the most specific applicable.
15. Multiple `@example` blocks ordered: lowest arg-count → complex → framework-specific.
16. ≤ 3 `@example` blocks (≤ 5 for umbrella symbols with distinct call forms).
17. First `@example` carries no title, shows simplest invocation.
18. Each `@example` shows one scenario.
19. Comments inside example code use only `// output:`, `// error:`, `// ok:`, `// ...`.
20. One blank line between imports and body; no other blank lines inside.
21. Identifier names consistent across same-symbol example blocks.
22. `@typeParam` for every type parameter, alphabetical.
23. `@throws` for every non-trivial exception type.
24. `{@link}` for in-project public symbols; backticks for literals, third-party, internal.
25. No `{@link X}` to a target already structurally linked on the same rendered page.
26. Inline `{@link}` in description prose only when occupying a formula-slot.
27. `@see` blocks alphabetical; in-project `{@link X}` first, external URL second.
28. Public types that structurally wrap a Web Platform / Intl type carry `@see <MDN URL>`.
29. Symbols with peer-pair prefixes carry `@see {@link Peer}` symmetrically.
30. No manual `@see` for parent/sibling members of namespace symbols.
31. `@deprecated` always includes migration path.
32. `@remarks` adds actionable nuance, passes the triple test.
33. `@remarks` contains no banned implementation-detail patterns.
34. Every claim verified against the symbol's implementation.
35. Secondary types carry no `@remarks` and no `@example`.
36. No duplicated `@example` or `@remarks` between primary and secondaries.
37. Cross-framework sibling families have byte-identical summaries except the binding slot.
38. No defaults inline in prose — only `@defaultValue`.
39. No second-person pronouns.
40. No domain elaboration in summary.
41. Sibling descriptions parallel.
42. All sentences are full natural prose.
43. Whitespace: empty line between each tag group, none within groups.
44. Standard phrasings used where applicable.
45. No banned words: `gets`, `sets`, `simply`, `just`, `automatically`, `easily`.
46. No placeholder identifiers in examples — Yak Pool only.
47. Code in `@example` is runnable.
48. `@packageDocumentation` present on each public entry file.
