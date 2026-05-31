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

A locale file is a JSON object keyed by source-file path. Each value is an object keyed by source string. Each entry value is the translation as a string.

```ts
type LocaleFile = Record<SourceFilePath, Record<SourceText, string>>
```

That is the whole format.

## Filename

`locales/<bcp47>.json` — e.g. `locales/sv.json`, `locales/pt-BR.json`. The target locale is implied by the filename. The source locale lives in `yapyak.config.ts`.

## What's NOT in the file

- Structural context (`element`, `attribute`, `component`, ancestors) — derived from the AST when needed
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
t.at('button', 'Open')
t.at('button', 'Hello, {name}', { name: user.name })
```

Two functions. `t(source, params?)` is the default. `t.at(context, source, params?)` disambiguates the same source string when it must mean different things in the same file.

### When to use `t.at()`

Rare. The default is `t()`. Use `t.at()` only when:

- Two or more `t()` calls in the same file use the same English source
- AND the translations differ between them
- AND rewriting the English to be more specific is not an option

```tsx
// Bad — same source, ambiguous meaning, default translation forced to compromise
<button>{t('Open')}</button>
<Badge>{t('Open')}</Badge>

// Option 1 — write more specific English
<button>{t('Open file')}</button>
<Badge>{t('Status: open')}</Badge>

// Option 2 — disambiguate with t.at
<button>{t.at('button', 'Open')}</button>
<Badge>{t.at('status', 'Open')}</Badge>
```

Option 1 is preferred when the English can change. Option 2 is for cases where the source string is fixed by design.

### `t.at` rules

- Context name must match `[a-z][a-z0-9-]*` (lowercase identifier, kebab-case for compound names)
- Once `t.at()` is used for a source in a file, every call to that source in the same file must also use `t.at()` (YPK403)
- Using `t.at()` where it doesn't actually disambiguate — single occurrence, or all occurrences with the same context — is a warning (YPK404)
- `t.at()` has zero runtime cost — the compiler strips it and replaces the call with the looked-up translation

### Key format in the locale file

Untagged calls store the source as the key:

```json
{ "src/Foo.tsx": { "Open": "Öppna" } }
```

Tagged calls store `source@context` as the key:

```json
{
  "src/Foo.tsx": {
    "Open@button": "Öppna",
    "Open@status": "Öppet"
  }
}
```

The locale file type does not change — it is always `Record<file, Record<string, string>>`. Some keys happen to contain `@`. The compiler builds keys; it never parses them.

A human reader, CAT tool, or AI translator that wants to identify the context from a key uses the convention: everything after the last `@` is the context, and it must match `[a-z][a-z0-9-]*`. If it does not match (e.g., source like `Send to user@example.com`), the key is untagged.

### Fallback when a translation is wrong

If a translation comes out wrong, **edit the locale file directly**. The locale file is normal JSON. Open it, fix the value, save.

## How the translator receives context

When yapyak invokes a *translator* for an entry, it assembles the payload **from the code, on demand**:

```
{
  source,                        // from the locale file
  sourceRef,                     // file:line:col
  context,                       // extracted from the AST now
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
- Every entry value is a string
- File-path keys use forward slashes, contain no `..`, are not absolute, do not escape the project root
- All strings are Unicode NFC

**Source–target invariants** (when target is non-empty):
- Every `{placeholder}` argument in the source appears in the target
- Every `{placeholder}` argument in the target appears in the source
- ICU argument names and types match between source and target
- ICU is well-formed
- ICU plural/select may legitimately use different branch sets per target-locale CLDR rules — yapyak does not flag locale-correct branch differences

**Code–locale-file invariants** (file together with source):
- For each `t()` call in source code, there is a corresponding entry under the file's key
- For each entry, there is a corresponding `t()` call (otherwise it is an orphan)
- Orphans are not errors; they are reported by `yapyak status` and removable via `yapyak clean`

## Diagnostic codes

Codes are organised by category. The first digit identifies the layer where the rule lives.

### YPK1xx — Call site

| Code | Severity | Meaning |
|---|---|---|
| YPK101 | error | `t()` called without arguments |
| YPK102 | error | Dynamic `source` argument at `t()` call site (must be a static literal) |
| YPK103 | error | Empty source string at `t()` call site |
| YPK104 | error | Missing parameter for placeholder in the params object |
| YPK105 | warning | Extra parameter in the params object with no matching placeholder |
| YPK106 | warning | Params passed dynamically (spread or non-literal) cannot be statically verified |

### YPK2xx — ICU

| Code | Severity | Meaning |
|---|---|---|
| YPK201 | error | Malformed ICU (unmatched braces, syntax error) |
| YPK202 | error | `plural`, `selectordinal`, or `select` is missing the required `other` branch |
| YPK203 | error | Unsupported ICU feature |
| YPK204 | error | ICU argument name or type incompatible between source and target |
| YPK205 | error | Placeholder in source missing from target (data loss at render time) |
| YPK206 | error | Placeholder in target missing from source |

### YPK3xx — Locale file integrity

| Code | Severity | Meaning |
|---|---|---|
| YPK301 | error | Locale-file entry value is not a string |
| YPK302 | error | File-path key is unsafe (`..`, absolute, symlink escape) |
| YPK303 | error | String is not Unicode NFC |

### YPK4xx — `t.at()` call site

| Code | Severity | Meaning |
|---|---|---|
| YPK401 | error | `t.at()` context argument is not a static string literal |
| YPK402 | error | `t.at()` context name does not match `[a-z][a-z0-9-]*` |
| YPK403 | error | Source used with both `t()` and `t.at()` in the same file — choose one |
| YPK404 | warning | `t.at()` does not disambiguate anything — the context has no effect |

## Trade-offs

- **The format depends on the source code.** A locale file alone is incomplete — yapyak validates and translates by reading both. This is a deliberate choice: the code already holds the truth; duplicating it into the file would invite drift.
- **One annotation, used rarely.** Only `t.at(context, source)` exists as an annotation, and only for the case where two `t()` calls in the same file genuinely need different translations for the same English source. Yapyak's position is that the English is the key — if the key is ambiguous, prefer rewriting the English; `t.at()` is the escape valve when the source string is fixed by design. There is no `hint` and no `maxLength` — translation issues are fixed by editing the locale file directly.
- **No status enum, no review flag, no candidates field.** Translation is straight `source → target`. Workflow signals (uncertainty, review-needed, AI-generated) live outside the file: Git history shows what changed, `yapyak status` shows the run's results, PR review catches problems.
- **Optional file size.** The file scales with translation count. A 500-string project is ~5–10 KB; a 10 000-string project is ~100–200 KB.

## Why this is the right shape

A locale file should be the smallest readable artifact that lets a human, an AI agent, or a CAT tool do translation work. Anything beyond that — context, identity metadata, workflow flags — either lives where it already exists (the code, the config, Git) or is reported on demand (the CLI, the translator payload).

Treating the locale file as a self-contained database was overthinking the problem. The code is the database. The locale file is a view into one dimension of it.
