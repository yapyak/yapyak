# yapyak Locale File Format — Specification

> Version 1.1 — Self-contained, AI-agent-native i18n file format.
>
> Schema URL remains `https://yapyak.dev/locale/v1` — v1.1 adds optional fields and sharpens semantics, no breaking changes to the v1 schema family.

## Purpose

This document specifies the on-disk format of yapyak locale files. It is the contract between:

- **yapyak's compiler** (writes locale files during the save loop)
- **Human translators** (read and edit values directly or via CAT tools)
- **AI translators** (read the file as a self-contained translation work item)
- **AI coding agents** (Claude Code, Cursor, Aider, and successors — read and write directly without yapyak running)
- **CAT tools** (Crowdin, Phrase, Lokalise — parse structured JSON for translator UIs)

The format is designed so that any of these consumers can operate on a locale file **without external context** — no separate config file, no glossary lookup, no source code parsing, no service call required.

---

## The Central Principle

> **A locale file is a self-contained translation work item for routine work.**

Open the file. Read the top. You have the project's tone, glossary, and translation instructions. Read the entries. You have the source string, its structural context, and its translation (or empty space for one).

Send this file to any AI. Edit it in any agent. Hand it to any *translator*. The file contains everything needed for the routine case.

When an entry's meaning remains genuinely ambiguous from the file alone (e.g., short polysemous strings like `Apply`, `Plan`, `Open`), the *translator* or AI may escalate: inspect source code as a fallback, or annotate the entry's `notes` field with a clarification request and set its `status` so a human can resolve it. Escalation is the exception, not the routine.

No layer of human-managed mapping exists between the file and the work to be done.

---

## Top-Level Structure

```jsonc
{
  "$schema": "https://yapyak.dev/locale/v1",
  "sourceLocale": "en",
  "targetLocale": "sv",
  "instructions": { /* ... */ },
  "glossary": [ /* ... */ ],
  "files": { /* ... */ }
}
```

Every locale file has exactly these six top-level fields: `$schema`, `sourceLocale`, `targetLocale`, `instructions`, `glossary`, `files`. Order is conventional (schema first, files last) but not enforced. Unknown top-level fields are preserved on write (for forward compatibility with future versions).

**String encoding.** All string values (sources, targets, glossary terms, hints) are normalized to Unicode NFC on write. yapyak enforces this on save; consumers writing the file by hand should do the same. This prevents identity drift between visually identical but byte-different strings (e.g., NFC `café` vs NFD `café`).

---

## Top-Level Fields

### `$schema`

**Type:** string (URI)
**Required:** yes
**Example:** `"https://yapyak.dev/locale/v1"`

Identifies the schema version of this file. The URI is an **identifier**, not a download URL — tools match on the literal string. The actual JSON Schema document is bundled with yapyak and published at the (separately versioned and replaceable) URL `https://yapyak.dev/schemas/locale-v1.json`. Version family is part of the identifier — `v1`, `v2`, etc. yapyak guarantees forward compatibility within a major version (`v1.0`, `v1.1`, ... all share the `v1` identifier and remain mutually readable).

### `sourceLocale`

**Type:** BCP 47 language tag (canonical form)
**Required:** yes
**Example:** `"en"`, `"en-US"`

The source locale that `source` fields are written in. For most projects this is `"en"`. Set in `yapyak.config.ts` once, emitted in every locale file.

### `targetLocale`

**Type:** BCP 47 language tag (canonical form)
**Required:** yes
**Example:** `"sv"`, `"sv-SE"`, `"pt-BR"`

The target locale this file contains translations into. One file per target locale.

**Canonical form.** yapyak accepts and emits BCP 47 tags with hyphen separators (`pt-BR`, never `pt_BR`), with language subtags lowercase and region subtags uppercase (`pt-BR`, not `pt-br`). All subtags must be registered in the IANA Language Subtag Registry. yapyak normalizes inputs on save.

### `instructions`

**Type:** object (see below)
**Required:** recommended, may be empty `{}`

Translation instructions that apply to every entry in this file. Inline so that AI agents do not need to read external config.

```jsonc
"instructions": {
  "tone": "Friendly, professional. Use 'du' (singular) not 'ni' (formal).",
  "hint": "This is a B2B product. Avoid casual idioms."
}
```

**Known instruction fields:**

| Field | Type | Purpose |
|---|---|---|
| `tone` | string | Free-text description of voice and register |
| `hint` | string | Additional free-text guidance for translators |

**Custom instruction fields are allowed.** Any additional key/value pair is accepted and forwarded to the AI verbatim in its system prompt. yapyak does not interpret unknown fields but preserves them.

**Why no `preserveICU`, `preservePlaceholders`, or similar instructions.** ICU MessageFormat argument names, argument types, and well-formedness, plus all `{placeholder}` tokens, are **compiler invariants** validated by `yapyak validate` — not translator preferences. ICU plural/select **branches** may legitimately differ per target-locale CLDR rules (Swedish `one`/`other`; Polish `one`/`few`/`many`/`other`; Arabic six categories). A literal "preserve exactly" instruction would force wrong output. See the [Validation](#validation) section for the actual invariants. *Translators* and AI may legitimately emit target-locale-correct plural/select branches; they MUST preserve argument names, types, and placeholder tokens.

### `glossary`

**Type:** array of glossary records
**Required:** recommended, may be empty `[]`

Project-specific term translations that must be applied consistently. Each record describes one source term and its target-locale translation, with optional metadata for disambiguating context-sensitive terms.

```jsonc
"glossary": [
  { "source": "checkout", "target": "kassa", "hint": "Noun form — the page/section." },
  { "source": "checkout", "target": "Slutför köp", "hint": "Imperative button label.", "domain": "billing" },
  { "source": "shipping", "target": "leverans" },
  { "source": "subscription", "target": "abonnemang" },
  { "source": "Stripe", "target": "Stripe", "hint": "Brand name — never translate." }
]
```

**Known glossary record fields (v1.1):**

| Field | Type | Required | Purpose |
|---|---|---|---|
| `source` | string | yes | Source term in the source locale |
| `target` | string | yes | Target-locale translation |
| `hint` | string | no | Free-text disambiguation/usage guidance |
| `domain` | string | no | Business-domain tag (`"billing"`, `"onboarding"`) |

**Forward-compatible extension fields** (not normative in v1.1 but preserved on write): `partOfSpeech`, `caseSensitive` (boolean, default false → case-folded match), `forbidden` (array of strings → never use these renderings), `alternatives` (array of strings → acceptable but less preferred). Unknown fields on glossary records are preserved on write.

**Case folding.** Matching is case-insensitive by default. Set `caseSensitive: true` to require exact-case matching.

**Multiple entries per source.** Two records may share `source` if they differ in `domain`, `hint`, or other disambiguators. The AI applies the record whose context best matches the entry being translated.

**Brand names and untranslatable terms.** Glossary is the canonical mechanism for "do not translate" decisions. Add the term with `source === target` and an explanatory `hint`. The AI applies the glossary; no per-entry "locked" flag is needed.

Glossary lives inline so AI agents do not need to load a separate glossary file. When the same project has multiple locales, each locale file has its own glossary (translated for that target locale).

### `files`

**Type:** object (file path → array of entries)
**Required:** yes

The actual translation entries, grouped by source file path. Each value is an **array of entry records** (see [Entry Record Format](#entry-record-format)).

```jsonc
"files": {
  "src/CoolButton.tsx": [
    { "source": "Save", "context": { /* ... */ }, "target": "Spara" }
  ],
  "src/StorePanel.tsx": [
    /* ... */
  ]
}
```

File paths are relative to the project root, using forward slashes regardless of OS. Path keys must:

- Use forward slashes exclusively (`src/components/Foo.tsx`, never `src\components\Foo.tsx`)
- Be **case-sensitive** in the canonical form — yapyak preserves the casing the file actually has on disk at extraction time, and treats `Components/Foo.tsx` and `components/Foo.tsx` as distinct paths even on case-insensitive filesystems
- Contain no `..` segments and no leading `/` — paths that would escape the project root are rejected (diagnostic YPK109)
- Not follow symlinks out of the project root — extraction resolves symlinks and validates the resolved path is inside the project

---

## Entry Record Format

Each entry is a JSON object with a fixed set of ownership zones, each owned by a different actor:

```jsonc
{
  "source": "Save",                                              // identity — never edited by humans or agents
  "context": {                                                    // compiler-owned — regenerated each save
    "kind": "elementChild",
    "container": "button",
    "enclosing": "SaveButton",
    "ancestors": [],
    "position": 1
  },
  "hint": "Form submit button — use a confident verb",            // optional free-text guidance
  "maxLength": 12,                                                // optional UI length constraint
  "needsReview": false,                                           // optional; true when human attention is needed
  "candidates": [ /* optional — see candidates field */ ],        // compiler-injected arbitration hints
  "target": "Spara"                                               // translation (empty string means not yet translated)
}
```

| Field | Owner | Lifetime |
|---|---|---|
| `source` | yapyak compiler (derived from the `t()` call site) | Replaced only when source code's literal changes; never authored by hand |
| `context` | yapyak compiler (AST-derived) | Regenerated on every save. Authored edits to `context` are overwritten — use `hint` for authored guidance |
| `hint` | Developers and *translators* | Preserved verbatim across saves |
| `maxLength` | Developers and *translators* | Preserved verbatim across saves |
| `needsReview` | AI, compiler, or developers | Set to flag the entry for human attention; cleared by manual review |
| `candidates` | yapyak compiler (injected for arbitration) | Present only when arbitration is needed; removed after the *translator* decides |
| `target` | *Translator* / AI / developer | The translation. Empty string `""` means "not yet translated" |

Unknown fields at the entry root are preserved on write but have no defined semantics — consumers are encouraged to put authored data in `hint` rather than inventing root-level fields.

**State is derived, not stored.** yapyak does not store an explicit `status` enum (e.g., `"missing"`, `"translated"`, `"needs-arbitration"`). Instead, the workflow state is **computed** from the existing fields:

| Derived state | Condition |
|---|---|
| `missing` | `target === ""` and no `candidates` field |
| `needs-arbitration` | `target === ""` and `candidates` field is present |
| `translated` | `target !== ""` and `needsReview` is absent or false |
| `needs-review` | `needsReview === true` (regardless of `target`) |
| `outdated` | `source` has changed since the last translation (detected by the compiler's rename detection; surfaced in CLI output) |

This keeps the file minimal: only fields carrying genuine information are stored. State is reported by `yapyak status` and `yapyak validate`, not duplicated in the JSON.

### `source`

**Type:** string (Unicode NFC)
**Required:** yes
**Owner:** compiler — do not edit by hand

The source-locale text passed to `t()` in the call site. This is the text the developer wrote in the source code. **It is identity** — see [Relation to the Identity Model](#relation-to-the-identity-model).

Source strings can contain:
- Plain text: `"Save"`, `"Welcome back"`
- ICU patterns: `"{count, plural, one {# item} other {# items}}"`
- Named placeholders: `"Hello, {name}"`

Sources must be static literals at the call site. Dynamic sources are rejected at compile time (diagnostic YPK001). Editing `source` by hand is a **rename** — it must be performed by editing the underlying `t()` call and letting yapyak detect it via position-based rename detection (see ADAPTIVE_IDENTITY_MODEL.md §7).

### `context`

**Type:** discriminated union object
**Required:** yes
**Owner:** compiler — regenerated each save

Structural context derived from the AST at the call site. Provides translation context for human and AI *translators*. **This field is compiler-owned. Edits made by hand will be overwritten on the next save.** Authored guidance belongs in `hint`.

See [The context Field](#the-context-field) for full specification.

### `hint`

**Type:** string
**Required:** no
**Owner:** developers and *translators* — preserved verbatim by the compiler

Optional free-text guidance for the *translator*. Authored by developers (typically via the `.hint()` chainable in source code) or by humans editing the locale file directly.

Examples:
- `"Form submit button — use a confident verb"`
- `"Could also be 'tillämpa' depending on context. Verify."`
- `"Rich text with formatting tags — preserve <b> and <link> exactly."`

When AI sets `needsReview: true`, it typically writes the reason into `hint` so reviewers know what to check.

### `maxLength`

**Type:** number (positive integer)
**Required:** no
**Owner:** developers and *translators*

Optional UI length constraint. Useful for buttons, labels, and other length-constrained UI surfaces.

**maxLength is a soft constraint, not a hard rule.** Different target languages have different length characteristics (German often 30–50% longer than English; CJK languages often shorter in code units but visually wider). yapyak treats `maxLength` as guidance to the *translator*:

- The *translator* (AI or human) tries to produce a `target` within `maxLength` characters.
- When it cannot fit naturally without losing meaning, it produces the best-fitting translation, sets `needsReview: true`, and explains the length issue in `hint`.
- `yapyak validate` emits **YPK112 [warning]** when `target.length > maxLength`. The build does not fail. The warning surfaces in CLI output and PR review tooling so humans can decide.

There is **no strict mode**. Hard-failing builds on `maxLength` overruns would force translations to be wrong in languages where the constraint is unrealistic — yapyak refuses to make that trade. If your UI cannot tolerate any overflow at all, the right fix is in the UI (truncate with ellipsis, wrap, allow variable width), not in the translation pipeline.

**Measurement.** Length is measured in JavaScript `string.length` (UTF-16 code units). For ICU plural/select messages, the **longest branch** is measured. Placeholder tokens are counted as they appear in the source (`{name}` = 6 characters).

**Diagnostic codes:**

| Code | Severity | Meaning |
|---|---|---|
| YPK112 | warning | `target.length > maxLength`. Surfaces over-length translations for human review |
| YPK113 | warning | `source.length > maxLength`. Developer set an unrealistic constraint at the call site |

### `needsReview`

**Type:** boolean
**Required:** no (default `false` / omitted)
**Owner:** AI translators, compiler, developers, humans

When `true`, the entry is flagged for human attention. Set by:

- **AI translator** when uncertain about a translation (typically pairs with a `hint` explaining the uncertainty)
- **Yapyak compiler** when source changes after translation (preserves the `target` and flags for review)
- **Humans** during PR review or manual inspection ("this looks wrong, someone verify")
- **External CAT tools** integrating with yapyak

Cleared by a human review action: either by editing the locale file directly (remove the field or set to false), or via `yapyak review` CLI.

Filter for entries needing review: search for `"needsReview": true` in the locale file, or run `yapyak status --needs-review`.

### `target`

**Type:** string (Unicode NFC)
**Required:** yes (may be empty `""`)

The translation in the target locale.

**Empty target semantics:**
- `target: ""` and no `candidates` → entry is `missing` (derived). Awaiting translation.
- `target: ""` and `candidates` present → entry is `needs-arbitration` (derived). *Translator* must decide between candidates or translate fresh.
- `target: "any value"` → entry is `translated` (derived). Leave alone unless `needsReview: true` is also set.

There is **no `locked` state**. Brand names and other "do not translate" terms are handled via the project's `glossary` (with `source === target`), not via per-entry flags.

The relationship between `target` and `source` is constrained by **compiler invariants** validated by `yapyak validate` — see the [Validation](#validation) section. In summary: ICU argument names and types must match between `source` and `target`, ICU well-formedness must hold, and all named placeholders in `source` must appear in `target`. Plural/select **branches** may legitimately differ per target-locale CLDR rules.

### `candidates`

**Type:** array of candidate records
**Required:** no (present only when arbitration is needed)
**Owner:** yapyak compiler — injected before translation, removed after the *translator* decides

When yapyak extracts a new entry whose source string already has translations elsewhere in the project but in a **different structural context**, it injects candidate translations into the entry. This lets the *translator* (any AI, including external coding agents) see prior translations of the same source and decide whether to reuse them or translate fresh.

```jsonc
{
  "source": "Open",
  "context": {
    "kind": "elementChild",
    "container": "Badge",
    "enclosing": "HoursBadge",
    "ancestors": [],
    "position": 1
  },
  "candidates": [
    {
      "target": "Öppna",
      "fromContext": {
        "kind": "elementChild",
        "container": "button",
        "enclosing": "StoreButton",
        "ancestors": [],
        "position": 1
      },
      "fromFile": "src/store/StoreButton.tsx"
    }
  ],
  "target": ""
}
```

**Candidate record fields:**

| Field | Type | Required | Purpose |
|---|---|---|---|
| `target` | string | yes | The translation from the related entry |
| `fromContext` | object | yes | The `context` of the entry this candidate came from |
| `fromFile` | string | yes | The source file containing the related entry |

**Lifecycle.**

1. Yapyak extracts a new `t()` call.
2. Project memory finds one or more translations of the same source in different contexts.
3. Yapyak writes the entry with `candidates` populated and `target: ""`. The derived state is `needs-arbitration`.
4. The *translator* (any AI implementing the translator interface) reads the entry.
5. The AI decides: use a candidate's `target`, or translate fresh.
6. The AI writes the chosen `target` and **removes the `candidates` field**.
7. Yapyak validates and persists. Derived state is now `translated` (or `needs-review` if AI also set `needsReview: true`).

**Why the field is removed after decision.** `candidates` is ephemeral arbitration scaffolding, not persistent state. Once the *translator* has decided, the chosen value (or the new translation) is canonical. Keeping `candidates` would bloat the file and confuse later readers about whether arbitration is still pending. The decision is implicit in the presence of a non-empty `target`.

**Why this lives in the locale file instead of in a prompt.** Earlier drafts had yapyak construct a "candidate-passing prompt" in code, sending source + context + candidates to the AI as a structured API request. v1.1 moves this into the JSON file itself. The locale file is the protocol — see [TRANSLATOR_INTERFACE.md](./TRANSLATOR_INTERFACE.md) and ADAPTIVE_IDENTITY_MODEL.md §6 for the architectural rationale. Any AI (Anthropic, OpenAI, local LLMs, coding agents like Claude Code or Cursor) sees the same structure and can perform arbitration without provider-specific yapyak adapters.

---

## The `context` Field

The `context` object provides per-string structural and semantic context, derived from the AST at the call site by yapyak's compiler. It is **compiler-owned**: yapyak regenerates it on every save, and any hand-written edits will be overwritten. Authored guidance and project metadata belong in `notes` instead.

### Discriminated union over 9 kinds

`context` is a **discriminated union** keyed by the `kind` field. The compiler emits one of nine fixed shapes — each kind has only the fields meaningful for that AST construct. Consumers narrow on `kind` (TypeScript, JSON Schema discriminator) to know exactly which fields are present.

This gives:
- **Compactness** — no forced-empty fields. A `variable` entry doesn't carry an empty `ancestors` array.
- **Semantic accuracy** — each kind uses field names that fit its AST shape.
- **Consistent semantics across kinds** — when two kinds share a field name, the field means the same thing.

### Universal field semantics

Six field names appear across the kinds. Each one means the same thing wherever it appears:

| Field | Meaning |
|---|---|
| `kind` | AST construct type (the discriminator). Always present. |
| `container` | The immediate AST construct's identifier name. Always present. |
| `slot` | Named position within `container`, when applicable. |
| `enclosing` | The next enclosing scope (function or component) above `container`. Always present (may be empty string for module-level). |
| `ancestors` | Enclosing components above `enclosing`. Only present for markup kinds. |
| `position` | Disambiguation ordinal (1-based) among calls with identical other-context fields. Always present. |

**The single rule:** Within a kind, the field set is fixed. Between kinds, fields vary — but a given field name always means the same thing.

### The nine kinds and their shapes

#### Markup kinds

```jsonc
// elementChild — t() is in element/component children
{
  "kind": "elementChild",
  "container": "<element or component name>",
  "enclosing": "<enclosing component>",
  "ancestors": [<enclosing components above enclosing>],
  "position": <integer ≥ 1>
}

// elementAttribute — t() is in an element/component attribute or prop value
{
  "kind": "elementAttribute",
  "container": "<element or component name>",
  "slot": "<attribute or prop name, camelCased>",
  "enclosing": "<enclosing component>",
  "ancestors": [<enclosing components above enclosing>],
  "position": <integer ≥ 1>
}
```

#### Object kinds

```jsonc
// objectProperty — t() is a value in an object literal
{
  "kind": "objectProperty",
  "container": "<variable name holding the object, or empty if anonymous>",
  "slot": "<property key>",
  "enclosing": "<enclosing function or empty>",
  "position": <integer ≥ 1>
}

// classProperty — t() is in a class field initializer
{
  "kind": "classProperty",
  "container": "<class name>",
  "slot": "<field name>",
  "enclosing": "<enclosing function or empty>",
  "position": <integer ≥ 1>
}
```

#### Variable / assignment

```jsonc
// variable — t() is the value of a const/let/var declaration
{
  "kind": "variable",
  "container": "<variable name>",
  "enclosing": "<enclosing function or empty>",
  "position": <integer ≥ 1>
}
```

#### Function-related kinds

```jsonc
// callArgument — t() is an argument to another function call
{
  "kind": "callArgument",
  "container": "<callee name; method name for member expressions>",
  "enclosing": "<enclosing function or empty>",
  "position": <integer ≥ 1>
}

// return — t() is a return statement value
{
  "kind": "return",
  "container": "<function name whose return this is>",
  "enclosing": "<outer enclosing function or class, or empty>",
  "position": <integer ≥ 1>
}

// throw — t() is in a throw expression (typically throw new ErrorClass(t(...)))
{
  "kind": "throw",
  "container": "<constructor or error class name>",
  "enclosing": "<enclosing function or empty>",
  "position": <integer ≥ 1>
}

// defaultParameter — t() is a default value of a function parameter
{
  "kind": "defaultParameter",
  "container": "<function name>",
  "slot": "<parameter name>",
  "enclosing": "<enclosing function or empty>",
  "position": <integer ≥ 1>
}
```

### Per-kind reference table

| `kind` | Required fields | `container` is... | `slot` is... | Notes |
|---|---|---|---|---|
| `elementChild` | container, enclosing, ancestors, position | HTML element or component name | (n/a) | Markup only |
| `elementAttribute` | container, slot, enclosing, ancestors, position | HTML element or component name | Attribute/prop name (camelCase) | Markup only |
| `objectProperty` | container, slot, enclosing, position | Variable name holding the object (empty if anonymous) | Property key | |
| `classProperty` | container, slot, enclosing, position | Class name | Field name | |
| `variable` | container, enclosing, position | Variable name itself | (n/a) | |
| `callArgument` | container, enclosing, position | Callee or method name | (n/a) | Argument index implicit via position when ambiguous |
| `return` | container, enclosing, position | Function name whose return this is | (n/a) | |
| `throw` | container, enclosing, position | Constructor class name (`Error`, `ValidationError`) | (n/a) | |
| `defaultParameter` | container, slot, enclosing, position | Function name | Parameter name | |

### Naming conventions

To keep the format extremely consistent:

- **CamelCase everywhere.** Both `kind` enum values and `slot` attribute names use camelCase. `aria-label` in source becomes `slot: "ariaLabel"`. `data-testid` becomes `slot: "dataTestid"`.
- **No dashes in JSON values.** The reverse mapping (camelCase → kebab-case attribute) is deterministic; yapyak handles it.
- **Container is an identifier, not a path.** `toast.error(t(...))` produces `container: "error"` (the method name), not `"toast.error"`.
- **PascalCase for components and constructors.** HTML elements stay lowercase (`button`, `h1`); React/Vue/Svelte components and constructors stay as written (`Dialog`, `ValidationError`).
- **Position is always present, always ≥ 1.** For most entries `position: 1`. Higher values appear only when true-twin disambiguation is needed (triggers diagnostic YPK009).

### Examples

```jsonc
// <button>{t('Save')}</button> inside App, wrapped in a Form
{
  "kind": "elementChild",
  "container": "button",
  "enclosing": "App",
  "ancestors": ["Form"],
  "position": 1
}

// <input placeholder={t('Search')} />
{
  "kind": "elementAttribute",
  "container": "input",
  "slot": "placeholder",
  "enclosing": "SearchField",
  "ancestors": [],
  "position": 1
}

// <button aria-label={t('Close')} />
{
  "kind": "elementAttribute",
  "container": "button",
  "slot": "ariaLabel",
  "enclosing": "Dialog",
  "ancestors": [],
  "position": 1
}

// const labels = { submit: t('Save') }
{
  "kind": "objectProperty",
  "container": "labels",
  "slot": "submit",
  "enclosing": "",
  "position": 1
}

// class Notification { title = t('New') }
{
  "kind": "classProperty",
  "container": "Notification",
  "slot": "title",
  "enclosing": "",
  "position": 1
}

// const SAVE_SUCCESS = t('Changes saved')
{
  "kind": "variable",
  "container": "SAVE_SUCCESS",
  "enclosing": "",
  "position": 1
}

// toast.error(t('Failed to save')) inside submitOrder function
{
  "kind": "callArgument",
  "container": "error",
  "enclosing": "submitOrder",
  "position": 1
}

// function getShiftLabel() { return t('Done') }
{
  "kind": "return",
  "container": "getShiftLabel",
  "enclosing": "",
  "position": 1
}

// throw new ValidationError(t('Invalid input')) inside validateEmail
{
  "kind": "throw",
  "container": "ValidationError",
  "enclosing": "validateEmail",
  "position": 1
}

// function greet(name = t('Friend'))
{
  "kind": "defaultParameter",
  "container": "greet",
  "slot": "name",
  "enclosing": "",
  "position": 1
}

// True twins — two identical buttons in same parent (triggers YPK009)
{ "kind": "elementChild", "container": "button", "enclosing": "ConfirmDialog", "ancestors": [], "position": 1 }
{ "kind": "elementChild", "container": "button", "enclosing": "ConfirmDialog", "ancestors": [], "position": 2 }
```

### Transparent AST nodes

When a `t()` call sits inside expression-wrapper nodes that have no meaningful semantic role of their own, yapyak walks through them and stops at the next meaningful container. These transparent nodes include:

- `BinaryExpression` (string concatenation: `'Hi ' + t('user')`)
- `LogicalExpression` (`flag && t('msg')`)
- `ConditionalExpression` (`a ? t('A') : t('B')`)
- `TemplateLiteral` (`` `Hi ${t('user')}` ``)
- `ArrayExpression` (`[t('A'), t('B')]`)
- `ParenthesizedExpression` (`(t('x'))`)
- `JSXFragment` (`<>{t('Hi')}</>`)
- `JSXExpressionContainer` (`{t('x')}` inside JSX)
- `SpreadElement` (`...t('x')` if statically resolvable)
- `TSAsExpression`, `TSSatisfiesExpression`, `TSNonNullExpression` (TypeScript assertions)

Walking through these means: a `t()` call in `flag ? t('A') : t('B')` inside a `<button>` ends up as `kind: "elementChild"` with `container: "button"` — the ConditionalExpression and JSXExpressionContainer are skipped.

### Framework-agnostic by design

The same nine kinds describe `t()` calls across React (TSX), Vue templates, Svelte markup, and Astro pages. Per-framework processors translate their AST into these canonical kinds; the locale file is identical regardless of source framework. See [ADAPTIVE_IDENTITY_MODEL.md §11](./ADAPTIVE_IDENTITY_MODEL.md#11-per-framework-specifics) for how each framework's constructs map.

### Why context is compiler-owned

**Predictable schema for tools.** When yapyak says `element: "button"`, every tool agrees what that means. Cross-tool interop is built on this.

**No write-conflict surface.** Earlier drafts of this spec mixed compiler-derived fields and author-authored fields under `context`. On regeneration, the compiler had no clean rule for what to preserve vs overwrite. v1.1 fixes this by giving compiler-owned data its own zone (`context`) and author-owned data its own zone (`notes`). The XML-namespaces / JSON-LD open-extension pattern still applies — just to `notes`, where it belongs.

**Migrating from earlier drafts.** Locale files written against v1.0 that placed `notes`/`domain`/`maxLength`/`reviewed` under `context` are read transparently by yapyak: on first write, those fields are migrated to the entry's `notes` object (or `status` for `reviewed`), and `context` is rewritten as compiler-owned only. The migration is non-destructive — no authored data is lost.

---

## Authoring API: `.hint()` and `.maxLength()`

The optional author-supplied entry fields (`hint`, `maxLength`) are populated from two sources:

1. **The locale file directly** — anyone (human, AI agent, *translator*) can edit these fields in `src/locales/<locale>.json` and yapyak preserves them on the next save loop.
2. **The source code** — developers attach them at the call site via chainable methods on `t()`. yapyak extracts them at compile time and writes them into the entry.

The chainable form makes annotation a code-review-visible part of authoring the UI. These are the only API surfaces yapyak adds beyond `t()` itself.

### Usage

```tsx
import { t } from 'yapyak';

// Simple case — no annotation
t('Save')

// With ICU parameters
t('Hello, {name}', { name: user.name })

// Free-text hint
t('Save').hint('Form submit button — use a confident verb')

// UI length constraint
t('Place order').maxLength(20)

// Both, in any order
t('Save').hint('Form submit button').maxLength(12)
t('Save').maxLength(12).hint('Form submit button')

// With ICU parameters
t('Hello, {name}', { name: user.name }).hint('Dashboard greeting').maxLength(30)
```

### What ends up in the locale file

Source code:

```tsx
t('Save').hint('Form submit button — use a confident verb').maxLength(12)
```

After `yapyak extract` runs:

```jsonc
{
  "source": "Save",
  "context": {
    "kind": "elementChild",
    "container": "button",
    "enclosing": "CheckoutForm",
    "ancestors": [],
    "position": 1
  },
  "hint": "Form submit button — use a confident verb",
  "maxLength": 12,
  "target": ""
}
```

`context` is compiler-derived. `hint` is populated from `.hint()`. `maxLength` is populated from `.maxLength()`. The three never overlap.

### Argument types

| Method | Argument | Example |
|---|---|---|
| `.hint(value)` | static string literal or const-bound string | `.hint('Form submit button')` |
| `.maxLength(value)` | static positive integer literal or const-bound number | `.maxLength(20)` |

Single-purpose methods. No object form, no overloading. Each method sets exactly one entry field.

### Compile-time behavior

Both methods are **stripped at compile time**. There is zero runtime cost. The compiled output is identical to a plain `t()` call:

```tsx
// Source
t('Save').hint('Form submit button').maxLength(12)

// Compiled
_pick({ en: 'Save', sv: 'Spara' })
```

The chainable methods exist only as compile-time directives that tell yapyak what to write into the entry. At runtime, the chain returns the translated string just as `t('Save')` would.

### Static-extraction requirements

Arguments must be statically resolvable at compile time. yapyak emits **YPK210** if not.

| Allowed | Not allowed |
|---|---|
| `.hint('literal string')` | `` .hint(`template ${expr}`) `` |
| `.hint(CONST_STRING)` (const literal) | `.hint(getValue())` |
| `.maxLength(20)` | `.maxLength(getMax())` |
| `.maxLength(MAX_CONST)` (const literal) | `.maxLength(maybeUndefined)` |

### Composition rules

Multiple methods can be chained on the same `t()` call. Each method can be called at most **once per call**. Order doesn't matter.

```tsx
// Both methods, in any order
t('Save').hint('Form submit button').maxLength(12)  ✓
t('Save').maxLength(12).hint('Form submit button')  ✓

// Same method twice — YPK211
t('Save').hint('A').hint('B')  ❌ YPK211
t('Save').maxLength(10).maxLength(20)  ❌ YPK211
```

### Diagnostics

| Code | Meaning |
|---|---|
| YPK210 | `.hint()` or `.maxLength()` argument is not a static literal |
| YPK211 | The same chainable method called more than once on the same `t()` call |
| YPK212 | Chainable called on something that is not a direct result of `t()` (e.g., `const x = t('Save'); x.hint(...)` — the chain must be in the same expression) |

### Why these names and not others

- **`.hint()`** matches the `hint` field it writes to. Says exactly what it is: a hint for the *translator*.
- **`.maxLength()`** matches the `maxLength` field. Self-explanatory.
- **No `.context({...})`**: `context` is compiler-owned. A method with that name would mislead developers about what they can write to.
- **No `.notes({...})`**: We deliberately avoid a kitchen-sink structured-object method. Each chainable does one thing.
- **No `.with({...})` or `.options({...})`**: Generic names hide intent. Specific names per-field make code readable.

### Why chainable methods instead of `t(source, options)`

A second argument on `t()` collides with ICU parameters:

```tsx
t('Hello, {name}', { name: 'Joakim' })           // params — unambiguous
t('Save', { hint: '...', maxLength: 20 })         // params? options? ambiguous
```

Chainable methods keep `t(source, params)` reserved for ICU parameter binding and add annotation as a separate, opt-in step. Each method is self-documenting at the call site.

### TypeScript types

The chainable returns a value that is both `string` (for runtime use) and exposes `.hint()` / `.maxLength()` (for compile-time chaining). At runtime, only the string side exists:

```ts
interface Translatable extends String {
  hint(value: string): Translatable
  maxLength(value: number): Translatable
}

declare function t(source: string): Translatable
declare function t(source: string, params: Record<string, unknown>): Translatable
```

Each method returns `Translatable` so chains can continue. Calling the same method twice is a compile error (YPK211) at the type level via branding (implementation detail).

### `needsReview` and other workflow fields are not authored at the call site

The chainable methods write only to **authored** fields (`hint`, `maxLength`). They cannot set:

- **`needsReview`** — workflow state set by AI translators (when uncertain) or humans (during review). Not a code-author concern.
- **`target`** — the translation itself, set by the *translator*.
- **`status`** — does not exist as a stored field; state is derived.

Workflow state and translations belong in the locale file (or in CLI tooling), not in source code annotations. Code declares intent; the locale file holds the workflow state.

### Future chainable additions

Other entry fields could become chainables if real demand emerges (`.domain()`, `.example()`, etc.). The pattern is established: one method per field, single argument, static literal, callable at most once. New methods can be added without redesigning the API.

Keeping `.hint()` to a single purpose keeps the API surface honest. One method, one job: a free-text hint.

---

## Common Patterns

### Simple translation

```jsonc
{
  "source": "Save",
  "context": {
    "kind": "elementChild",
    "container": "button",
    "enclosing": "SaveButton",
    "ancestors": [],
    "position": 1
  },
  "target": "Spara"
}
```

### Same source, different contexts (homonyms)

When two `t('Open')` calls exist in the same file with different `container` (different element), they appear as **separate parallel records**:

```jsonc
"src/StorePanel.tsx": [
  {
    "source": "Open",
    "context": {
      "kind": "elementChild",
      "container": "button",
      "enclosing": "StorePanel",
      "ancestors": [],
      "position": 1
    },
    "target": "Öppna"
  },
  {
    "source": "Open",
    "context": {
      "kind": "elementChild",
      "container": "Badge",
      "enclosing": "StorePanel",
      "ancestors": [],
      "position": 1
    },
    "target": "Öppet"
  }
]
```

No object form, no sub-keys. Just two records. The `context.container` distinguishes them naturally.

### True twins (positional disambiguation)

When two calls share `kind`, `container`, `enclosing`, AND `ancestors` with no other distinguishing context, only `position` separates them:

```jsonc
"src/dialogs/ConfirmDialog.tsx": [
  {
    "source": "OK",
    "context": {
      "kind": "elementChild",
      "container": "button",
      "enclosing": "ConfirmDialog",
      "ancestors": [],
      "position": 1
    },
    "target": "OK"
  },
  {
    "source": "OK",
    "context": {
      "kind": "elementChild",
      "container": "button",
      "enclosing": "ConfirmDialog",
      "ancestors": [],
      "position": 2
    },
    "target": "OK"
  }
]
```

This emits diagnostic YPK009 — see [ADAPTIVE_IDENTITY_MODEL.md §13.2](./ADAPTIVE_IDENTITY_MODEL.md#132-true-twins-same-source-same-role-same-parent). Reordering breaks the mapping; the developer should refactor to distinct sources or wrap in distinguishing components.

### Plain TypeScript — call argument

```jsonc
{
  "source": "Order placed",
  "context": {
    "kind": "callArgument",
    "container": "success",
    "enclosing": "submitOrder",
    "position": 1
  },
  "target": "Beställning lagd"
}
```

`container` is the method name (`success` from `toast.success`).

### Plain TypeScript — throw

```jsonc
{
  "source": "Invalid email",
  "context": {
    "kind": "throw",
    "container": "ValidationError",
    "enclosing": "validateEmail",
    "position": 1
  },
  "target": "Ogiltig e-postadress"
}
```

### Plain TypeScript — object property

```jsonc
{
  "source": "Save",
  "context": {
    "kind": "objectProperty",
    "container": "labels",
    "slot": "submit",
    "enclosing": "",
    "position": 1
  },
  "target": "Spara"
}
```

`container` is the variable binding the object (`labels`); `slot` is the property key.

### Plain TypeScript — class property

```jsonc
{
  "source": "New notification",
  "context": {
    "kind": "classProperty",
    "container": "Notification",
    "slot": "title",
    "enclosing": "",
    "position": 1
  },
  "target": "Ny notis"
}
```

### Plain TypeScript — variable

```jsonc
{
  "source": "Changes saved",
  "context": {
    "kind": "variable",
    "container": "SAVE_SUCCESS",
    "enclosing": "",
    "position": 1
  },
  "target": "Ändringar sparade"
}
```

### Plain TypeScript — return

```jsonc
{
  "source": "Done",
  "context": {
    "kind": "return",
    "container": "getShiftLabel",
    "enclosing": "",
    "position": 1
  },
  "target": "Klar"
}
```

### Plain TypeScript — default parameter

```jsonc
{
  "source": "Friend",
  "context": {
    "kind": "defaultParameter",
    "container": "greet",
    "slot": "name",
    "enclosing": "",
    "position": 1
  },
  "target": "Vän"
}
```

### Attribute with camelCased aria-name

```tsx
<button aria-label={t('Close dialog')} />
```

```jsonc
{
  "source": "Close dialog",
  "context": {
    "kind": "elementAttribute",
    "container": "button",
    "slot": "ariaLabel",
    "enclosing": "Dialog",
    "ancestors": [],
    "position": 1
  },
  "target": "Stäng dialogen"
}
```

The source code uses `aria-label` (with dash). The `slot` field stores `ariaLabel` (camelCased). Yapyak handles the reverse mapping deterministically.

### Inline hint and maxLength (authored guidance)

```jsonc
{
  "source": "Save",
  "context": {
    "kind": "elementChild",
    "container": "button",
    "enclosing": "SaveButton",
    "ancestors": [],
    "position": 1
  },
  "hint": "This save commits to the database. Use a definitive verb, not a tentative one.",
  "maxLength": 12,
  "target": "Spara"
}
```

### Empty value pending translation

```jsonc
{
  "source": "Loading...",
  "context": {
    "kind": "elementChild",
    "container": "div",
    "enclosing": "LoadingState",
    "ancestors": [],
    "position": 1
  },
  "target": ""
}
```

New entries materialized by `yapyak extract` are derived as `missing` (target empty, no candidates) until filled.

### Brand names (handled by glossary, not per-entry locking)

```jsonc
{
  "source": "Stripe",
  "context": {
    "kind": "elementChild",
    "container": "span",
    "enclosing": "PaymentFooter",
    "ancestors": [],
    "position": 1
  },
  "target": "Stripe"
}
```

This looks like any other translated entry. The `target === source` value is the result of applying the project's glossary:

```jsonc
"glossary": [
  { "source": "Stripe", "target": "Stripe", "hint": "Brand name — never translate" }
]
```

There is **no `status: "locked"` flag**. The AI doesn't retranslate existing entries with non-empty `target` by default. If the glossary says "Stripe → Stripe", the *translator* applies that consistently. Brand-name "locking" is a glossary concern, not a per-entry one.

### AI flags ambiguity for human review

```jsonc
{
  "source": "Apply",
  "context": {
    "kind": "elementChild",
    "container": "button",
    "enclosing": "FiltersPanel",
    "ancestors": [],
    "position": 1
  },
  "hint": "Could be 'använd' (use), 'tillämpa' (enforce), or 'lägg till' (add). I chose 'använd' for filter-apply context — please verify.",
  "needsReview": true,
  "target": "Använd"
}
```

When the AI cannot confidently translate from context alone, it produces a best-guess `target`, writes the rationale and uncertainty into `hint`, and sets `needsReview: true`. The derived state is `needs-review`.

A human reviewer can find these via `yapyak status --needs-review` or by filtering on `"needsReview": true`. After review:
- If correct: remove `needsReview` (or set to false). Derived state becomes `translated`.
- If wrong: edit `target`, remove `needsReview`. Derived state becomes `translated`.

---

## Full Example

```jsonc
{
  "$schema": "https://yapyak.dev/locale/v1",
  "sourceLocale": "en",
  "targetLocale": "sv",

  "instructions": {
    "tone": "Friendly, professional. Use 'du' not 'ni'.",
    "hint": "B2B product. Avoid casual idioms. Match Stripe's Swedish for billing terms."
  },

  "glossary": [
    { "source": "checkout", "target": "kassa", "hint": "Noun form — the section/page." },
    { "source": "checkout", "target": "Slutför köp", "hint": "Imperative button label.", "domain": "billing" },
    { "source": "shipping", "target": "leverans" },
    { "source": "subscription", "target": "abonnemang" },
    { "source": "invoice", "target": "faktura" },
    { "source": "Stripe", "target": "Stripe", "hint": "Brand name — never translate." }
  ],

  "files": {
    "src/components/SaveButton.tsx": [
      {
        "source": "Save changes",
        "context": {
          "kind": "elementChild",
          "container": "button",
          "enclosing": "SaveButton",
          "ancestors": [],
          "position": 1
        },
        "target": "Spara ändringar"
      }
    ],

    "src/store/StorePanel.tsx": [
      {
        "source": "Open",
        "context": {
          "kind": "elementChild",
          "container": "button",
          "enclosing": "StorePanel",
          "ancestors": [],
          "position": 1
        },
        "target": "Öppna"
      },
      {
        "source": "Open",
        "context": {
          "kind": "elementChild",
          "container": "Badge",
          "enclosing": "StorePanel",
          "ancestors": [],
          "position": 1
        },
        "target": "Öppet"
      }
    ],

    "src/checkout/CheckoutForm.tsx": [
      {
        "source": "Place order",
        "context": {
          "kind": "elementChild",
          "container": "button",
          "enclosing": "CheckoutForm",
          "ancestors": [],
          "position": 1
        },
        "hint": "Primary checkout action. Strong, confident verb.",
        "maxLength": 20,
        "target": "Lägg beställning"
      }
    ],

    "src/orders/submitOrder.ts": [
      {
        "source": "Order placed",
        "context": {
          "kind": "callArgument",
          "container": "success",
          "enclosing": "submitOrder",
          "position": 1
        },
        "target": "Beställning lagd"
      },
      {
        "source": "Could not place order",
        "context": {
          "kind": "callArgument",
          "container": "error",
          "enclosing": "submitOrder",
          "position": 1
        },
        "target": "Kunde inte lägga beställning"
      }
    ],

    "src/payment/PaymentFooter.tsx": [
      {
        "source": "Stripe",
        "context": {
          "kind": "elementChild",
          "container": "span",
          "enclosing": "PaymentFooter",
          "ancestors": [],
          "position": 1
        },
        "target": "Stripe"
      }
    ]
  }
}
```

Notes on this example:
- **`Stripe` is "locked" via the glossary.** The entry itself looks identical to any other translated entry. The glossary applies `Stripe → Stripe` consistently across all entries.
- **`Place order` has `hint` and `maxLength`.** These are optional flat fields, not a `notes` zone.
- **No `status` field anywhere.** State (`missing`, `translated`, etc.) is derived from the existing fields.

This single file gives any consumer — AI agent, human translator, CAT tool — everything they need.

---

## Migration from Adaptive Object Form

Earlier yapyak drafts used an adaptive object form within a file-scoped map:

```jsonc
{
  "src/StorePanel.tsx": {
    "Open": {
      "button": "Öppna",
      "Badge": "Öppet"
    }
  }
}
```

The v1 format converts this to records-per-file:

```jsonc
{
  "files": {
    "src/StorePanel.tsx": [
      {
        "source": "Open",
        "context": { "kind": "elementChild", "container": "button", "enclosing": "StorePanel", "ancestors": [], "position": 1 },
        "target": "Öppna"
      },
      {
        "source": "Open",
        "context": { "kind": "elementChild", "container": "Badge", "enclosing": "StorePanel", "ancestors": [], "position": 1 },
        "target": "Öppet"
      }
    ]
  }
}
```

### Why the change

The adaptive object form was clever — entries stayed flat when unambiguous, became object form only when needed. It minimized noise in locale files.

But:

1. **AI agents need uniform structure.** Variable shapes (sometimes string, sometimes object) require branch handling in every consumer.
2. **Context belongs with every entry.** AI agents reading the file standalone need element/role per string, not just on collision.
3. **Self-containment is the priority for v1.** A file that drops external dependencies for translation work is more valuable than a file that minimizes byte count.

The trade-off is explicit: locale files are larger and more uniform. AI agents can operate on them without external context. This is the right trade-off for the AI-agent era.

### Migration tool

`yapyak migrate-locale-format` reads existing adaptive-object-form locale files and rewrites them in v1.1 format.

**Migrated automatically:**
- Bare-string entries (`{ "Save": "Spara" }`) → single records with `source`, `context`, `value`
- Object-form entries with AST-derived sub-keys (`{ "Open": { "button": "Öppna", "Badge": "Öppet" } }`) → one record per sub-key with the sub-key parsed into `context.element` / `context.role` / etc.
- Positional-fallback sub-keys (`#1`, `#2`) → records with `context.position.index`
- v1.0 entries with `notes` / `domain` / `maxLength` under `context` → those fields moved to `notes`
- v1.0 entries with `reviewed: true` under `context` → translated to `status: "translated"` (or `"needs-review"` if `reviewed: false`)

**Requires manual conversion (the tool flags these):**
- Object-form entries with sub-keys that do not map to AST roles (e.g., `{ "Open": { "primary": "Öppna", "secondary": "Öppet" } }` from hand-edited locale files) — the tool emits records with `notes.description` carrying the original sub-key and `status: "needs-review"` for the developer to resolve.
- Locale files with structurally invalid entries (missing source, non-string values) — the tool reports the line and skips the entry.

The tool is run once per project; the change is committed to Git. Backward-compatible **reading** of the v1.0 and adaptive-object-form is supported for two minor versions after v1.1. **Writing** in old formats is not supported.

---

## CAT-Tool Integration

The v1.1 format is designed for CAT tools that support structured JSON with field-path mapping (Crowdin's Structured JSON parser, Phrase's structured-JSON formats, Lokalise's JSON imports with custom parsers, and others). The translatable field is `value`, the lookup key is `source`, and `context` plus `notes` are passed through to the *translator* UI as supplementary context.

**No CAT-tool configurations are shipped in this specification.** End-to-end-verified integration recipes — including the exact parser versions, JSONPath / JSON-Pointer expressions, and glossary/instructions handling for each tool — are maintained in a separate document (`INTEGRATIONS.md`) and updated as recipes are verified one tool at a time. Treat the previous draft's inline Crowdin/Phrase/Lokalise snippets as superseded; they were not verified end to end and contained schema errors.

### Flat-format bridge for legacy tools

For CAT tools that cannot be configured for structured JSON, yapyak provides export/import bridges:

```bash
$ yapyak export --cat-format=flat > flat.json
$ yapyak import --cat-format=flat translated-flat.json
```

The flat format is a simple `source → value` map, lossy with respect to `context`, `notes`, and `status`. It is intended for one-shot integration handoffs, not as a canonical store. The v1.1 records-array file remains the source of truth.

---

## Agent Interaction Guide

This section is written for AI coding agents (Claude Code, Cursor, Aider, and successors) that read or write yapyak locale files.

### Reading the file

1. **Open the file as JSON.**
2. **Read `instructions` and `glossary`** — these apply to every translation in the file.
3. **Iterate over `files`** — each key is a source file path, each value is an array of entries.
4. **For each entry:**
   - `source` is the source-locale text (Unicode NFC)
   - `context` describes where in the code it appears (compiler-owned — do not edit)
   - `notes` carries authored guidance (`description`, `domain`, `maxLength`, etc.)
   - `status` indicates lifecycle state (`missing`, `translated`, `locked`, `needs-review`)
   - `value` is the translation (or `""` if missing/locked)

For routine translation the file is self-contained — do not read source code or external files unless an entry is genuinely ambiguous from its `source` + `context` + `notes` alone. When ambiguity remains, see [Escalating ambiguity](#escalating-ambiguity).

### Writing translations

When filling in missing translations:

1. **Find entries where `status === "missing"`** (or, for backward compatibility with files without `status`, where `value === ""` and there is no `status: "locked"`).
2. **For each, translate `source` to the target locale** (specified in top-level `locale` field).
3. **Apply `instructions.tone` and `glossary` records.** When multiple glossary records share a `source`, choose the one whose `domain` / `notes` best matches the entry's `context` and `notes`.
4. **Use `context` to disambiguate.** A button label may translate differently than a heading even if the source is identical.
5. **Preserve all `{placeholder}` tokens** present in `source`.
6. **For ICU messages,** preserve argument names and types. **Plural/select branches may legitimately differ** per target locale (Swedish: `one`/`other`; Polish: `one`/`few`/`many`/`other`). Emit the branches the target locale's CLDR plural rules require.
7. **Write the translation to `value`** and **set `status: "translated"`**.
8. **Save the file.** Do not modify `source`, `context`, or any field outside `value`/`status`/`notes` of existing entries.

### Adding new entries

When adding a new `t()` call to source code, **do not author the locale entry by hand**. The `context` fields (`element`, `role`, `component`, `kind`, `ancestors`, `position`) are identity-derived from the AST. Hand-authored values inevitably diverge from what `yapyak extract` would compute, and the next extraction run will either duplicate or invalidate the entry.

The correct workflow:

1. **Edit source code.** Add the `t('<source text>')` call.
2. **Materialize the locale entry.** Run `yapyak extract`, or rely on the Vite plugin which runs extraction on save. yapyak creates a new entry with `source` set, `context` derived from the AST, and `status: "missing"`, `value: ""`.
3. **Fill the `value`.** Either translate the entry yourself, or run `yapyak translate` to invoke the configured AI *translator*.
4. **Optionally annotate `notes`.** Add `description`, `domain`, `maxLength`, or other authored guidance — these are preserved across future extractions.
5. **Run `yapyak validate`** to confirm the file is well-formed.

**Why this matters.** yapyak's identity model treats the source code as the single source of truth for translation identity (see [ADAPTIVE_IDENTITY_MODEL.md](./ADAPTIVE_IDENTITY_MODEL.md)). Letting agents hand-author the identity-derived fields would re-introduce the manual-mapping drift that source-as-identity exists to eliminate. Editing `value`, `status`, and `notes` is always safe; editing or hand-creating `source` and `context` is not.

### Escalating ambiguity

When an entry's meaning is genuinely ambiguous from `source` + `context` + `notes` alone (short polysemous words like `Apply`, `Plan`, `Open`, or domain terms without enough context):

1. **Write a `notes.question`** explaining the ambiguity and the candidate meanings.
2. **Set `status: "needs-review"`**.
3. **Leave `value` empty** (or with a best-guess translation prefixed with `[?]`).
4. **Do not silently choose** one meaning when the file gives no signal — the next pass should be human.

### Respecting authored fields in `notes`

The `notes` object is the open-extension zone for project-specific data (`domain`, `maxLength`, `description`, `screenshot`, plus any custom keys a team defines). When working with entries:

- **Read `notes` fields as additional translation context.** A `maxLength` constraint or `domain: "billing"` tag may change the chosen phrasing.
- **Preserve `notes` verbatim when writing.** yapyak never drops fields from `notes`, and agents must not either.
- **Do not invent values.** Only add `notes` fields when the developer or project conventions explicitly call for them.
- **Do not duplicate compiler-owned data.** `element`, `role`, `component`, etc. live in `context` — do not copy them into `notes`.

### What NOT to do

- **Do not change `source` fields.** They are identity. Changing them is a rename, which must be performed by editing the underlying `t()` call so yapyak's position-based rename detection (ADAPTIVE_IDENTITY_MODEL.md §7.1) can carry the translation.
- **Do not hand-author `context` fields.** `context` is regenerated by `yapyak extract` from the AST. Any hand-authored value will be overwritten — and worse, may not match what extraction would compute, causing duplicate or invalid entries.
- **Do not delete entries** unless you also remove the corresponding `t()` call. Orphan retention is intentional (ADAPTIVE_IDENTITY_MODEL.md §8).
- **Do not reorder entries** unless necessary. yapyak emits stable order.
- **Do not author custom fields under `context`.** Authored data belongs in `notes`. yapyak's migration will move misplaced custom fields out of `context` on the next save.
- **Do not invent values for fields you don't have evidence for.** Only set `notes` fields the developer or project conventions explicitly call for. Only set `status: "locked"` when the entry is genuinely fixed (brand names, do-not-translate terms).

---

## Validation

yapyak validates locale files against a set of **invariants** — properties that must always hold regardless of who wrote the file (compiler, AI, human, agent). Invariants are enforced by `yapyak validate` and the build-time hook, not by *translator* instructions.

### Built-in validation

```bash
$ yapyak validate src/locales/sv.json
```

Checks (each maps to a diagnostic in the table below):

**Schema invariants:**
- `$schema` is a recognized version (YPK101)
- All required top-level fields are present: `$schema`, `locale`, `sourceLocale`, `instructions`, `glossary`, `files` (YPK102)
- Each entry has the required fields `source` and `value`; `context` is present and is an object (YPK103, YPK107)
- `source` is a non-empty string (YPK106)
- `value` is a string (may be empty when `status` permits it)
- `locale` and `sourceLocale` are valid BCP 47 tags in canonical form (YPK108)
- `status` is one of `missing`, `translated`, `locked`, `needs-review` (YPK110)
- All file path keys are valid (no `..`, no leading `/`, no symlink escape) (YPK109)

**Encoding invariants:**
- All string values are in Unicode NFC (YPK111)

**Identity invariants:**
- Within a single file's entry array, no two entries share both `source` AND a structurally-equal `context` (YPK112). Two entries that differ only by an authored field are considered duplicate.

**ICU and placeholder invariants** (applied when both `source` and `value` are non-empty):
- Every `{placeholder}` named-argument that appears in `source` MUST appear in `value` (YPK105 — missing in target, the dangerous direction)
- Every `{placeholder}` named-argument that appears in `value` MUST appear in `source` (YPK113 — extraneous in target)
- For ICU MessageFormat `value` strings:
  - The set of named arguments must match `source` (YPK104a — argument set mismatch)
  - The argument **types** (`plural`, `selectordinal`, `select`, `number`, `date`, `time`) must match `source` for each shared argument (YPK104b — argument type mismatch)
  - The `value` must be a well-formed ICU MessageFormat string (YPK104c — malformed ICU)
  - **Plural and select branches MAY legitimately differ between `source` and `value`** — the target locale's CLDR plural rules dictate which branches are required, and Swedish (`one`/`other`), Polish (`one`/`few`/`many`/`other`), and Arabic (`zero`/`one`/`two`/`few`/`many`/`other`) all require different branch sets. yapyak does NOT flag legitimate branch differences
  - The `other` branch is always required (YPK104d — missing `other` branch)

These ICU rules are **invariants**, not *translator* instructions. The old `preserveICU: true` instruction has been removed from v1.1 — the spec correctness now lives in `yapyak validate`.

### JSON Schema

A formal JSON Schema is bundled with yapyak and published at `https://yapyak.dev/schemas/locale-v1.json` (a downloadable document distinct from the `$schema` identifier `https://yapyak.dev/locale/v1`). IDEs and editors with JSON Schema support get autocomplete and validation automatically when the file references the identifier.

### Diagnostics

| Code | Meaning |
|---|---|
| YPK101 | Unknown `$schema` version |
| YPK102 | Missing required top-level field |
| YPK103 | Entry missing required field (`source`, `context`, or `value`) |
| YPK104a | ICU argument set in `value` does not match `source` |
| YPK104b | ICU argument type in `value` does not match `source` |
| YPK104c | ICU pattern in `value` is malformed |
| YPK104d | ICU plural/select missing required `other` branch |
| YPK105 | Placeholder present in `source` is missing from `value` (data loss at render time) |
| YPK106 | `source` is empty or contains only whitespace |
| YPK107 | `context` is not an object |
| YPK108 | `locale` or `sourceLocale` is not a valid BCP 47 tag |
| YPK109 | File path key contains `..`, leading `/`, or escapes project root via symlink |
| YPK110 | `status` is not one of the allowed enum values |
| YPK111 | String value is not in Unicode NFC |
| YPK112 | Two entries in the same file have identical `source` and `context` (duplicate identity) |
| YPK113 | Placeholder appears in `value` but not in `source` |

---

## Versioning Policy

### Major version (`v1` → `v2`)

A new major version may introduce breaking changes to the schema. yapyak supports reading the previous major version for at least 12 months after a new major version is released. A migration tool converts older formats forward.

The schema identifier carries the major version family:
- `https://yapyak.dev/locale/v1` → version 1.x (includes v1.0, v1.1, ...)
- `https://yapyak.dev/locale/v2` → version 2.x

All minor versions within a major family share the same identifier and remain mutually readable.

### Minor versions (`v1.0` → `v1.1`)

Minor versions add new optional fields and sharpen semantics. Files written by older minor versions remain valid. Files written by newer minor versions are readable by older yapyak versions, with unknown fields preserved but ignored.

v1.1 specifically: introduces the four-zone entry shape (`source`, `context`, `notes`, `status`, `value`), the records-array glossary, the `position` true-twins disambiguator, and stronger validation invariants. No breaking changes to the v1 identifier or the v1.0 entries' core fields.

### Adding known fields

A new field added to the *known* `context` schema, the `notes` known-fields table, or the `status` enum is a minor version bump. yapyak emits it; consumers that do not understand it preserve it.

### Adding custom fields under `notes`

Adding custom fields under `notes` in projects is not a version change. The open-extension zone is always available — `notes` is where author-owned data lives, and yapyak preserves unknown keys verbatim.

### Removing or repurposing known fields

This is a major version change. yapyak does not remove known fields lightly.

---

## Relation to the Identity Model

The locale file format and the [adaptive identity model](./ADAPTIVE_IDENTITY_MODEL.md) are two layers of the same architecture:

| Layer | Concern | Where specified |
|---|---|---|
| **Identity** | How translations are uniquely identified across the project | `ADAPTIVE_IDENTITY_MODEL.md` |
| **Storage** | How identified translations are written to disk | This document |

The identity model says: identity is `(source, AST role, ancestors, positional fallback when true twins exist)` derived from the AST. The storage format says: identity is **represented** as records with `source` and `context` fields, with `context.position.index` carrying the positional fallback when needed.

These are consistent but separable. A future locale format (v2) could change storage representation without changing the identity model. The identity model could evolve without changing the file format.

### Why no stable per-entry ID

v1.1 does not introduce a stable yapyak-owned `id` field on entries. This is a deliberate architectural choice consistent with the identity model's central thesis: **the code is the identity**. Adding a stable ID would:

1. Reintroduce a layer of human-managed (or compiler-managed) mapping between the locale file and the source code — the very thing source-as-identity removes.
2. Sabotage refactor detection (ADAPTIVE_IDENTITY_MODEL.md §5), which works by matching `(source, role)` across the diff. With stable IDs assigned at extraction time, a move from file A to file B would receive a new ID for the destination; refactor detection would have to compute the move *anyway* and then copy the ID — pure dead weight.
3. Sabotage the locale-file-as-memory property (ADAPTIVE_IDENTITY_MODEL.md §4): cross-file translation memory is keyed by `source`, so any IDs are unused in the hot lookup path.
4. Create a new write-conflict surface (whose ID is canonical when two agents extract simultaneously?) with no offsetting benefit.

**The true-twins case** (two `t('OK')` calls with identical element, role, AND component) is addressed by the positional disambiguator `context.position.index` — see [ADAPTIVE_IDENTITY_MODEL.md §2.3](./ADAPTIVE_IDENTITY_MODEL.md#23-the-5-case--object-form) and [§13.2](./ADAPTIVE_IDENTITY_MODEL.md#132-true-twins-same-source-same-role-same-parent). The known limitation (reordering twins breaks the mapping) is explicitly accepted as a rare, documented edge case.

Both documents are required reading for yapyak contributors. Users of yapyak rarely need to read either.

---

## Trade-Offs (Honest)

The v1 format makes deliberate trade-offs. They are documented here so future contributors understand the choices.

### Larger files

The v1 format is roughly 3× the size of a flat source-as-key map. For a 500-string project, that is ~25KB instead of ~8KB. For a 5,000-string project, ~250KB instead of ~80KB.

**Why accepted:** modern file systems and editors handle this with no perceptible cost. The benefit of self-containment outweighs the byte cost.

### Source is a field, not a key

In a flat map (`{"Save": "Spara"}`), the source string is the JSON key. Direct lookup is `obj["Save"]`. In v1, source is a field within a record, and lookup requires array iteration.

**Why accepted:** yapyak's runtime does not lookup translations from JSON at runtime — they are compiled into modules. The cost of array iteration is paid only by tooling, which is fast enough.

### Refactor changes data

When `<button>` becomes `<a>`, the `context.element` field changes. Git diff shows the change. In the adaptive object form, this was invisible.

**Why accepted:** visibility is preferable to invisibility. Reviewers see what changed. AI translators on the next run can re-evaluate if the language requires it. The data captures real structural change.

### CAT tools require configuration

Many CAT tools default to flat key-value JSON. The records-array format requires per-tool configuration to map fields correctly.

**Why accepted:** structured-JSON CAT tools (Crowdin, Phrase, Lokalise, and others) support field-path mapping. yapyak ships verified per-tool recipes in INTEGRATIONS.md (separate from this spec) and provides a `--cat-format=flat` export for legacy tools.

### Adaptive shape is gone

The adaptive object form (bare strings for unambiguous entries, objects for homonyms) is gone. Every entry is a record with the same shape.

**Why accepted:** uniformity is more valuable than compactness for tooling. The 5% case of homonyms becomes the 100% case of uniform records. Consumers no longer branch on entry shape.

### Records-array storage produces merge conflicts

When two developers add entries to the same file on different branches, the records-array form produces line-overlap merge conflicts that a keyed-object form (`{ "source": value }`) would resolve automatically.

**Why accepted:** keyed objects cannot represent same-source homonyms (the very case the adaptive object form addressed and the records form generalizes). The conflict surface is small in practice because yapyak emits entries in stable order grouped by extraction site, and most adds are appends rather than mid-array insertions. For projects with high concurrent-edit pressure, a future major version may explore a hybrid `(source, position-in-file)`-keyed object representation.

### No stable per-entry IDs

Entries have no yapyak-owned ID. Identity is `(source, context)` and is recomputed on every save.

**Why accepted:** see [Relation to the Identity Model > Why no stable per-entry ID](#why-no-stable-per-entry-id). Adding IDs would re-introduce the manual-mapping layer that source-as-identity exists to remove, and would not enable any capability that source-as-key plus positional fallback does not already provide.

---

## Future Considerations

These are deliberately out of scope for v1.1 but are anticipated for future minor or major versions.

### Embedded source position

```jsonc
"context": { "kind": "elementChild", "container": "button", "enclosing": "App", "ancestors": [], "position": 1, "sourcePosition": { "line": 12, "column": 24 } }
```

Useful for precise refactor detection and IDE jumping. Distinct from `context.position.index` (the true-twins disambiguator). Likely added to `context` as an optional known field in a future minor version.

### Per-entry history

Per-entry history of previous translations and source revisions could be persisted as an underscore-prefixed metadata field:

```jsonc
{
  "source": "Save",
  "_lastTranslatedFrom": "Save",
  "_history": [
    { "target": "Spara", "translatedAt": "2025-08-01" },
    { "target": "Spara ändringar", "translatedAt": "2025-09-15", "reason": "source-rename" }
  ],
  "target": "Spara"
}
```

A `_lastTranslatedFrom` field would be the minimum hook for deriving the `outdated` state durably. Richer history records are a future opt-in.

### Provenance per entry

```jsonc
"_provenance": "ai-translated:claude-sonnet-4.5"
```

Track which model translated each entry. Per ADAPTIVE_IDENTITY_MODEL.md §9, provenance is currently computed per save and emitted to CLI / `.yapyak/provenance.json` (gitignored). Promoting it into the entry as a durable `_provenance` field is a future opt-in.

### Plural / ICU explicit forms

Currently ICU patterns are inside `source` and `value` strings. A future version may expand them into structured form:

```jsonc
{
  "source": { "pattern": "{count, plural, one {# item} other {# items}}", "params": ["count"] },
  "target": { "pattern": "{count, plural, one {# vara} other {# varor}}", "params": ["count"] }
}
```

This would enable richer tooling validation. Under consideration.

## Rejected Alternatives

These have been considered and explicitly rejected. They are documented here so the same questions do not keep returning in future reviews.

### Multi-locale inline (`translations: { sv, de, fr }`)

Consolidating all locales into a single file with per-entry `translations` map was considered and **rejected as a permanent architectural choice**. One file per locale is correct because:

- It maps cleanly to per-locale work assignments (one *translator* owns one file).
- It enables per-locale CI checks, per-locale CAT-tool sync, per-locale Git ownership.
- It scopes PR diffs (a French *translator*'s PR doesn't touch the German file).
- Per-locale `instructions` and `glossary` are themselves locale-specific (Swedish `du` vs `ni` guidance is meaningless to German *translators*).
- It avoids cross-locale merge conflicts on shared entries.

The multi-locale-inline form will not return.

### Stable per-entry IDs

Assigning yapyak-owned stable IDs to every entry was considered and **rejected**. See [Relation to the Identity Model > Why no stable per-entry ID](#why-no-stable-per-entry-id). Identity comes from the code; adding a mapping layer would undo the architecture rather than complete it.

### Free-text status via `notes`

Earlier drafts used a free-text note (`"Brand name — do not translate"`) as the only signal for do-not-translate entries. This was **rejected** in v1.1 because validation cannot distinguish authored notes from machine-actionable lifecycle state. Lifecycle now lives in the `status` enum; notes are descriptive only.

---

## Conclusion

The yapyak locale file format v1.1 is a deliberate departure from minimalist source-as-key designs. It chooses **self-containment** over **compactness** because the dominant consumer of locale files in the coming decade will be AI coding agents that operate without external context.

A v1.1 locale file is a complete translation work item with explicit ownership zones: compiler-owned identity and structure (`source`, `context`), author-owned guidance (`notes`), machine-actionable lifecycle (`status`), and the translation itself (`value`). Open it. Translate it. Save it. Done. No external lookups, no missing context, no silent ambiguity.

The format preserves yapyak's central principle — **the code is the identity** — while adapting the storage layer for an agent-native era. Identity remains source-as-key with AST-derived disambiguation; the storage representation now distinguishes who owns what and when it can be regenerated.

This is the format yapyak commits to for v1.1, and the foundation we expect the v1 family to evolve on through additive minor versions.
