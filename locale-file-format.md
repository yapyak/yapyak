# Locale file format

> The locale file is for humans first. Context lives in the code.

## The format

```json
{
  "src/pages/index.astro": {
    "Hello there": "Hej där",
    "Save changes": "Spara ändringar",
    "You have {count, plural, one {# message} other {# messages}}": "Du har {count, plural, one {# meddelande} other {# meddelanden}}"
  }
}
```

A locale file is a JSON object keyed by source-file path. Each value is an object keyed by source string. The value of each source-string entry is either the translation as a string, or — when the developer has disambiguated with `.tag()` — an object keyed by tag.

```ts
type LocaleFile = Record<SourceFilePath, Record<SourceText, string | Record<TagName, string>>>
```

That is the whole format.

## Filename

`locales/<bcp47>.json` — e.g. `locales/sv.json`, `locales/pt-BR.json`. The target locale is implied by the filename. The source locale lives in `yapyak.config.ts`.

## Disambiguation with `.tag()`

When the same source string would mean different things at different call sites in the same file, the developer disambiguates explicitly with the `.tag()` chainable:

```tsx
<button>{t('Open').tag('action')}</button>
<Badge>{t('Open').tag('status')}</Badge>
```

The locale entry becomes object-form, keyed by tag:

```json
{
  "src/StorePanel.tsx": {
    "Open": {
      "action": "Öppna",
      "status": "Öppet"
    }
  }
}
```

### The per-file rule

For each source string in each file:

| Occurrences | Tagging | Entry shape |
|---|---|---|
| 1 | no `.tag()` | `"Save": "Spara"` (string) |
| 1 | `.tag('x')` | `"Save": { "x": "Spara" }` (object) |
| 2+ | all tagged | `"Save": { "a": "...", "b": "..." }` (object) |
| 2+ | any untagged | **YPK009 error** — homonym must be disambiguated |
| 2+ | mixed tagged/untagged | **YPK009 error** — all-or-none |

A `.tag()` on any occurrence promotes the entry to object-form, even when there is only one occurrence today. This is deliberate: it future-proofs the JSON shape. Adding a second tagged occurrence later just adds a key under the existing object — no shape mutation, no diff churn on the original entry.

### Tags are developer-controlled, not AST-derived

The tag string is whatever the developer writes. It does not have to match the AST element name. It is preserved verbatim across refactors, across `<button>` → `<a>` changes, across component renames. Refactoring `<button>{t('Open').tag('action')}</button>` to `<a>{t('Open').tag('action')}</a>` does not change the locale-file entry — the tag is the identity, not the AST shape.

Tags should describe **what the call means**, not what it looks like. Good tag names: `action`, `status`, `heading`, `cta`, `header`, `footer`, `confirm`, `cancel`. Tag names follow normal identifier conventions (lowercase, kebab-case for compound names) and must be unique within an entry.

### When to add `.tag()`

Add `.tag()` only when you have (or will have) multiple `t()` calls with the same source string in the same file that need different translations. yapyak's compiler emits **YPK009** when it detects an untagged homonym, telling you exactly which call sites need tagging. You do not have to anticipate homonyms — let the compiler tell you when you have one.

## What's NOT in the file

- Structural context (`element`, `attribute`, `component`, ancestors) — derived from the AST when needed
- `hint` and `maxLength` — live at the call site as chainables
- Glossary and tone — live in `yapyak.config.ts`
- `status` / `needsReview` / `candidates` / `notes` — none of these exist as stored fields
- AST positions or identifiers
- Schema version markers (the format is stable; a `$schema` key is optional and ignored by yapyak)

## Where each concern lives

| Concern | Location |
|---|---|
| Translation text | Locale file |
| Source text | `t()` call in source code |
| Structural context | Source code AST |
| Per-call guidance | `.hint('...')` chainable at call site |
| Length constraint | `.maxLength(N)` chainable at call site |
| Homonym disambiguation | `.tag('...')` chainable at call site |
| Glossary | `yapyak.config.ts` (per locale) |
| Tone / register | `yapyak.config.ts` (per locale) |
| Source locale | `yapyak.config.ts` |
| Target locales | `yapyak.config.ts` |
| Review state | Git history and PR diffs |
| AI uncertainty | Reported by `yapyak status` from a translation run; not persisted in the file |

## Authoring API

```tsx
import { t } from 'yapyak'

t('Save')
t('Hello, {name}', { name: user.name })
t('Save').hint('Form submit button — use a confident verb')
t('Place order').maxLength(20)
t('Open').tag('action')
t('Welcome, {name}', { name: user.name }).hint('Dashboard greeting').maxLength(30)
t('Open').tag('action').hint('Primary call-to-action').maxLength(12)
```

Three orthogonal chainables, each doing one thing:

| Method | Purpose | JSON effect |
|---|---|---|
| `.hint(string)` | Free-text guidance for the *translator* | Not stored — passed to the translator at translation time |
| `.maxLength(positive integer)` | UI length constraint | Not stored — passed to the translator and to validation |
| `.tag(string)` | Homonym disambiguation key | **Promotes the entry to object-form**, keyed by tag |

Common rules:

- Arguments must be static literals or const-bound values
- Each method may be called at most once per `t()` call
- Order is free; `.tag('a').hint('b').maxLength(20)` and `.maxLength(20).tag('a').hint('b')` are equivalent
- All three are stripped at compile time — zero runtime cost

## How the translator receives context

When yapyak invokes a *translator* for an entry, it assembles the payload **from the code, on demand**:

```
{
  source,                        // from the locale file
  sourceRef,                     // file:line:col
  context,                       // extracted from the AST now
  hint,                          // extracted from .hint() chainable now
  maxLength,                     // extracted from .maxLength() chainable now
  glossary,                      // from yapyak.config.ts
  tone,                          // from yapyak.config.ts
  sourceLocale, targetLocale     // from yapyak.config.ts
}
```

Nothing about this payload is stored. It is built at translation time and discarded after the translation is written.

Code-aware translators (Claude Code, Cursor, any agent with filesystem access) may ignore the `context` payload and read the source file directly via `sourceRef`. yapyak provides the convenience; it does not assume the consumer is blind to the code.

## Validation

`yapyak validate` checks invariants over the locale file together with the source code.

**Format invariants** (file alone):
- Every entry value is either a string or an object whose values are strings (tag-keyed)
- File-path keys use forward slashes, contain no `..`, are not absolute, do not escape the project root
- Tag names within an entry are unique
- All strings are Unicode NFC

**Source–target invariants** (when target is non-empty):
- Every `{placeholder}` argument in the source appears in the target
- Every `{placeholder}` argument in the target appears in the source
- ICU argument names and types match between source and target
- ICU is well-formed
- ICU plural/select may legitimately use different branch sets per target-locale CLDR rules — yapyak does not flag locale-correct branch differences

**Code-locale-file invariants** (file together with source):
- For each `t()` call in source code, there is a corresponding entry under the file's key (with the correct tag key if tagged)
- For each entry — and each tag within an entry — there is a corresponding `t()` call (otherwise it is an orphan)
- Multiple `t()` calls with the same source string in the same file must either all be tagged with distinct tags, or be a single occurrence
- Orphans are not errors; they are reported by `yapyak status` and removable via `yapyak clean`

**Length constraints** (when `.maxLength(N)` is set at the call site):
- Warning if `target.length > N`
- Warning if `source.length > N` (developer set an unrealistic constraint)

## Diagnostic codes

| Code | Severity | Meaning |
|---|---|---|
| YPK001 | error | Dynamic `source` argument at `t()` call site (must be a static literal) |
| YPK009 | error | Homonym: multiple `t()` calls with the same source in the same file must all be tagged with `.tag()`, with distinct tag names |
| YPK101 | error | Locale-file entry value is not a string or a string-valued object |
| YPK102 | error | File path key is unsafe (`..`, absolute, symlink escape) |
| YPK103 | error | String is not Unicode NFC |
| YPK104 | error | ICU is malformed or argument-incompatible between source and target |
| YPK105 | error | Placeholder in source missing from target (data loss at render time) |
| YPK106 | error | Placeholder in target missing from source |
| YPK110 | error | Locale-file entry shape does not match the source: tagged in code but string in file, or vice versa; or tag keys do not match the `.tag()` values in source |
| YPK120 | warning | `target.length > maxLength` (soft constraint) |
| YPK121 | warning | `source.length > maxLength` (developer-side constraint mismatch) |
| YPK210 | error | `.hint()`, `.maxLength()`, or `.tag()` argument is not a static literal |
| YPK211 | error | Same chainable called more than once on the same `t()` call |
| YPK212 | error | Chainable called on something that is not a direct result of `t()` |

## Trade-offs

- **The format depends on the source code.** A locale file alone is incomplete — yapyak validates and translates by reading both. This is a deliberate choice: the code already holds the truth; duplicating it into the file would invite drift.
- **Homonyms require explicit `.tag()`.** yapyak does not silently disambiguate by position or by AST element. When the compiler detects two `t()` calls with the same source in one file, it errors (YPK009) until the developer names the distinction. The cost is a moment of thought per homonym; the benefit is drift-safe, reorder-safe, refactor-safe entries with human-readable disambiguation keys.
- **No status enum, no review flag, no candidates field.** Translation is straight `source → target`. Workflow signals (uncertainty, review-needed, AI-generated) live outside the file: Git history shows what changed, `yapyak status` shows the run's results, PR review catches problems.
- **Optional file size.** The file scales with translation count, not with structural metadata. A 500-string project is ~5–10 KB; a 10 000-string project is ~100–200 KB.

## Why this is the right shape

A locale file should be the smallest readable artifact that lets a human, an AI agent, or a CAT tool do translation work. Anything beyond that — context, identity metadata, workflow flags — either lives where it already exists (the code, the config, Git) or is reported on demand (the CLI, the translator payload).

Treating the locale file as a self-contained database was overthinking the problem. The code is the database. The locale file is a view into one dimension of it.
