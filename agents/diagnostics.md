## Diagnostics

Every yapyak-style library emits diagnostics: compile-time errors/warnings from the build pipeline, and runtime warnings from app code. This document defines the **single uniform system** for those diagnostics: code format, allocation policy, constant naming, documentation URLs, and message tone.

The goal is *structural consistency* — no team-discretion, no exception-ridden style, no drift between code and docs.

### Code format

```
YAP0001
^^^^^^^
||||  ||
||||  └── 4-digit sequential identifier (0001–9999), leading zeros required
└┴┴┴── prefix: always `YAP`
```

- Prefix is fixed: `YAP`.
- Identifier is exactly four digits. `YAP0001`, not `YAP1`. `YAP0042`, not `YAP42`.
- Identifiers are **monotonic sequential integers** allocated from a single registry. No subsystem encoding, no range partitioning.

### Source of truth — a single typed constants file

Every diagnostic code lives in **one file** as a typed constant. The library exports this file from a stable internal path (e.g. `src/diagnostics/codes.ts`).

```ts
const DOCS_BASE = 'https://yapyak.dev/d';

export const YAP = {
  PARSER_NO_SOURCE: 'YAP0001',
  PARSER_TEMPLATE_LITERAL: 'YAP0002',
  CATALOG_INVALID_SHAPE: 'YAP0003',
  // ...
  LOCALE_SET_IGNORED: 'YAP0031',
} as const;

export type YapCode = (typeof YAP)[keyof typeof YAP];

export function docsUrl(code: YapCode): string {
  return `${DOCS_BASE}/${code.toLowerCase()}`;
}
```

**Three exports from one file:**

1. `YAP` — frozen object of named code constants.
2. `YapCode` — type derived from `YAP`. Use this everywhere a diagnostic code is referenced in a type signature.
3. `docsUrl(code)` — pure function that builds the documentation URL.

**No diagnostic code may exist outside this file.** No string-literal `'YAP0042'` anywhere in source code — every reference goes through `YAP.<NAME>`. The TypeScript compiler enforces uniqueness, refactor-safety, and typo-immunity.

### Allocation policy

Sequential. Append-only. Never reused.

1. **Allocating a new code:** find the highest existing number in `codes.ts`, add one, append a new constant. Never insert between existing entries.
2. **Retiring a code:** mark the constant `[RETIRED]` in its line comment and keep it in the file. **Do not delete. Do not reuse the number.**
3. **Re-purposing an existing code is forbidden.** If meaning changes, retire the old one and allocate a new one.
4. **A code describes exactly one state.** If two situations need different diagnostic context, allocate two codes.

```ts
// ✓ Right — sequential allocation, single-purpose
export const YAP = {
  PARSER_NO_SOURCE: 'YAP0001',
  PARSER_TEMPLATE_LITERAL: 'YAP0002',
  CATALOG_INVALID_SHAPE: 'YAP0003',
  PARSER_SPREAD_PARAMS: 'YAP0004',  // allocated later, not inserted between 0001 and 0002
} as const;

// ✓ Right — retired code stays, never reused
export const YAP = {
  PARSER_NO_SOURCE: 'YAP0001',
  PARSER_TEMPLATE_LITERAL: 'YAP0002',
  // YAP0003 — [RETIRED v2.0] superseded by YAP0042 + YAP0043
  PARSER_SPREAD_PARAMS: 'YAP0004',
} as const;

// ✗ Wrong — inserting between
export const YAP = {
  PARSER_NO_SOURCE: 'YAP0001',
  PARSER_NEW_VARIANT: 'YAP0001a',  // never. allocate a new sequential number.
  PARSER_TEMPLATE_LITERAL: 'YAP0002',
} as const;
```

### Constant naming

Format: `<SUBSYSTEM>_<EVENT>` in SCREAMING_SNAKE_CASE.

- **Subsystem** is a single word identifying the area: `PARSER`, `CATALOG`, `LOCALE`, `RUNTIME`, `PERSISTENCE`, `TRANSLATE`, `PLACEHOLDER`, etc.
- **Event** describes the specific state in 1–4 words: `NO_SOURCE`, `INVALID_SHAPE`, `LISTENER_THREW`, `SSR_LEAK_RISK`.
- **Adjectives come last:** `LOCALE_FILE_CORRUPT`, not `LOCALE_CORRUPT_FILE`. `LOCALE_FORCED_INVALID`, not `LOCALE_INVALID_FORCED`.
- **No negations:** `PERSISTENCE_COOKIE_NO_WRITER` should be `PERSISTENCE_COOKIE_WRITER_MISSING`. State the positive form of the observed condition.
- **Subsystem names are added to a closed list** the same way verb prefixes are. Extending the list requires adding it here:

| Subsystem | Domain |
| --- | --- |
| `PARSER` | Compile-time errors at `t()` call sites in user code |
| `CATALOG` | Locale-file shape, encoding, paths |
| `PLACEHOLDER` | ICU placeholder parity between source and translation |
| `CONTEXT` | `t.as()` disambiguation |
| `RUNTIME` | Library initialization, SSR isolation |
| `PERSISTENCE` | Cookie / local-storage / URL persistence flows |
| `LOCALE` | `getLocale` / `setLocale` / locale state mutations |
| `TRANSLATE` | Auto-translate runtime |
| `FORMAT` | `Intl.*Format` runtime fallbacks (currency, unit, time zone) |

### Documentation URLs

URLs are computed from one constant and one function. No other surface.

```ts
const DOCS_BASE = 'https://yapyak.dev/d';

export function docsUrl(code: YapCode): string {
  return `${DOCS_BASE}/${code.toLowerCase()}`;
}
```

- **`DOCS_BASE`** is the single base URL constant. To move the docs (e.g. to `docs.yapyak.com/diagnostics`), change this one line.
- **`docsUrl(code)`** is the only way to produce a docs URL. URL format (lowercase code as path segment by default) is controlled here.
- **No URL string literal may appear anywhere else in source code.** Every link is computed.

#### URL placement in messages — render-time, not emit-time

The URL is appended by **the renderer** that prints the diagnostic, not by the code that emits the diagnostic. This keeps messages clean for testing/snapshotting and lets each renderer choose the best format (terminal hyperlinks, plain text, JSON, etc.).

```ts
// ✓ Right — emit site references the code only
diagnostics.push({
  code: YAP.PARSER_NO_SOURCE,
  message: 't() called without source string.',
  ...
});

// ✓ Right — renderer appends the URL
function renderDiagnostic(d: Diagnostic): string {
  return `[yapyak] ${d.code} ${d.fileId}:${d.range.start.line}: ${d.message}\nSee ${docsUrl(d.code)}`;
}

// ✗ Wrong — URL hardcoded in the message
diagnostics.push({
  code: YAP.PARSER_NO_SOURCE,
  message: 't() called without source string. See https://yapyak.dev/d/yap0001',
});
```

For runtime `warn()` calls the warn function itself is the renderer and appends the URL automatically:

```ts
// emit site:
warn('setLocale ignored. Value is not in the configured locales.', {
  code: YAP.LOCALE_SET_IGNORED,
  requested: value,
});

// what the user sees:
// [yapyak] YAP0031 setLocale ignored. Value is not in the configured locales.
// See https://yapyak.dev/d/yap0031
```

### Message tone — strict rules

Every diagnostic message follows the same tone. No team-discretion.

#### Hard rules

1. **No em-dashes (`—`).** Use period + sentence, or colon + clarifier.
2. **Subject-first.** `Source "X" is empty.` not `There is an empty source "X".`
3. **Present tense, indicative.** Not `will fail`, not `failed to`.
4. **Two sentences exactly:** *what was observed* + *what to do about it*. No more, no less.
5. **Period ends every sentence.** Always.
6. **No first-person, no apology, no please.** State facts. `setLocale ignored.` not `We've ignored your setLocale call, sorry.`
7. **No hedging.** No `consider`, `might want to`, `perhaps`, `you should`. Use imperative: `Replace X with Y.`

#### Quoting and code style

8. **String values: double quotes** in message text: `value "de" is not configured`.
9. **Code identifiers: backticks**: `` `setLocale` is ignored ``.
10. **File paths: bare**: `in src/foo.tsx`, not `in "src/foo.tsx"`.
11. **Locale tags: double quotes**: `locale "sv-FI" is not supported`.

#### Diagnostic-object semantics

When the diagnostic object carries `hint`, the **`message` field carries the observation only** and **`hint` carries the fix**. Do not put hint phrases in the message.

```ts
// ✓ Right
diagnostics.push({
  code: YAP.PARSER_TEMPLATE_LITERAL,
  message: 'Template literal not allowed in t().',
  hint: "Replace `t(`Hi ${name}`)` with `t('Hi {name}', { name })`.",
});

// ✗ Wrong — fix inside message, hint duplicates
diagnostics.push({
  code: YAP.PARSER_TEMPLATE_LITERAL,
  message: "Template literal not allowed in t(). Replace with t('Hi {name}', { name }).",
  hint: 'Use placeholders instead.',
});
```

For runtime `warn()` calls (no separate `hint` field), the message itself is two sentences: observation + action.

```ts
// ✓ Right — observation, then action
warn('setLocale ignored. Value "de" is not in the configured locales.', {
  code: YAP.LOCALE_SET_IGNORED,
  configured: LOCALES,
  requested: value,
});
```

#### Tone examples — before and after

| Before | After |
| --- | --- |
| `setLocale ignored — value not in configured locales.` | `setLocale ignored. Value "de" is not in the configured locales.` |
| `getLocale() fell back to the shared module-global locale on the server — register the host-integration middleware so each request binds its own locale.` | `getLocale() fell back to the shared module-global locale on the server. Register the host-integration middleware so each request binds its own locale.` |
| `Unsafe file-path key "${pathKey}" — must be relative, use forward slashes, and contain no ".." segments.` | `Unsafe file-path key "${pathKey}". Paths must be relative, use forward slashes, and contain no ".." segments.` |
| `We couldn't load the locale file — sorry!` | `Locale file failed to load. Verify the path is correct and readable.` |
| `t.as() — consider providing a source.` | `t.as() called without source string. Provide the English source as the first argument.` |

### Catalog structure — `diagnostics.md` in the library

The library mirrors this rule file with its own concrete catalog. The catalog groups entries by subsystem **for readability**, but the numeric identifiers are sequential and respect the allocation order shown in `codes.ts`. Sections do not own number ranges.

```md
## YAP diagnostic catalog

### Parser (compile-time)
- `YAP0001` (`PARSER_NO_SOURCE`) — t() called without source string.
- `YAP0002` (`PARSER_TEMPLATE_LITERAL`) — Template literal not allowed in t().
- `YAP0004` (`PARSER_SPREAD_PARAMS`) — Spread params not allowed in t().

### Catalog validation (compile-time)
- `YAP0003` (`CATALOG_INVALID_SHAPE`) — Entries are not a valid object shape.

### Runtime: locale state
- `YAP0031` (`LOCALE_SET_IGNORED`) — setLocale call ignored.
```

Non-contiguous numbering inside a section is **expected and correct** — it reflects allocation history.

### Authoring discipline — what every diagnostic-touching commit verifies

Adding or changing a diagnostic touches **three artifacts in one commit**:

1. `codes.ts` — new constant or `[RETIRED]` marker.
2. `diagnostics.md` (in the library) — new catalog entry under the right subsystem section.
3. The emit site — references `YAP.<NAME>` and respects the tone rules.

Code review checks all three are in sync. There is no diagnostic in source without an entry in `codes.ts` and a row in the catalog.
