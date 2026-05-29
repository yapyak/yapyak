# Plan: FormatJS ICU parser + exact compatibility matrix

> Status: **Fas 1 implemented.** The FormatJS swap, the gated subset, the new
> diagnostics, and both deviation fixes (`#` locale formatting, `currency`-code
> required) have landed with full parser + runtime test coverage. This document
> captures the decision + the exact ICU surface yapyak supports, so it can be turned
> into docs.
> Drafted 2026-05-29.

## Principles (the contract)

Three rules govern everything in this document:

1. **We own what we support, and it is a closed set.** The *Supported* matrix below
   is the contract: if it is on the list, it parses, type-checks (as far as TS
   reasonably can), extracts, translates, and formats correctly — end-to-end, in
   every framework. We can stand behind every row.
2. **Everything else is a build error — no silent behaviour, ever.** Unsupported
   features, malformed ICU, non-literal sources, anything the runtime cannot honour:
   it does not silently degrade, mis-format, or ship. It **fails the build** with a
   diagnostic. (This is the entire point of the FormatJS swap.)
3. **TypeScript catches as much as is _reasonable_, not as much as is _possible_.**
   We type value-types and param/tag presence for the common cases (flat + shallow
   nesting ≈ 99% of real strings), instantly, with no codegen. We do **not**
   gold-plate the type layer for deeply-nested ICU — it degrades gracefully and the
   compiler is the 100% backstop. We **document the boundary** rather than pretend
   completeness. Transparency over false safety.

Everything below is the concrete expression of these three rules: an exact owned
surface, a hard error for everything outside it, and a clearly-stated type-layer
boundary.

## Decision

Replace the hand-rolled ICU scanner in `@yapyak/compiler` (`parser/placeholder.ts`)
with the reference parser **`@formatjs/icu-messageformat-parser`**, used **at build
time only** (zero runtime cost — it is never shipped to the browser).

Why:

- The hand-rolled parser silently mis-handles real ICU (verified counter-examples:
  `{x, foobar, y}` → silent `simple`; `Hello {name` → phantom param;
  `Send '{count}' files` → phantom `count`; `{n, plural, offset:1 …}` → false
  "missing other"). A correctness library cannot ship that.
- The reference parser is conformance-tested against the ICU spec by millions of
  installs. Delegating is the only way to go from "we think it works" to "proven".
- It is build-time only, so it is consistent with the minimal-runtime ethos. The
  runtime keeps its tiny interpreter; the full parser never ships.

## The key insight (read this before implementing)

The **runtime** (`packages/yapyak/src/translation/interpolate.ts`) is the source of
truth for what yapyak actually *supports*. FormatJS parses the **entire** ICU spec,
but our runtime only formats a **subset**. So the parser must not merely *parse* —
it must **gate to the runtime-supported subset** and reject everything else with a
clear diagnostic. Otherwise the build passes and the browser breaks (parser/runtime
divergence).

```
FormatJS parser (full ICU)  ⊇  yapyak accepted subset (= runtime-supported)  ⊇  diagnostics for the rest
```

## Spec reference

There is **no single, versioned "ICU MessageFormat 1.0" specification document.**
MF1 is defined *operationally* by the ICU implementation; the name "ICU
MessageFormat 1.0" was coined **retroactively** by the MessageFormat 2.0 effort to
label its predecessor. The authoritative references for the surface yapyak targets:

- **ICU User Guide — Formatting Messages** (de-facto syntax reference):
  <https://unicode-org.github.io/icu/userguide/format_parse/messages/>
- **ICU4J `MessageFormat` API** (the implementation that defines the grammar):
  <https://unicode-org.github.io/icu-docs/apidoc/released/icu4j/com/ibm/icu/text/MessageFormat.html>
- **FormatJS ICU syntax docs** (what our parser `@formatjs/icu-messageformat-parser`
  accepts in practice): <https://formatjs.github.io/docs/core-concepts/icu-syntax/>
- **CLDR Plural Rules (UTS #35 / TR35)** — defines the categories
  `zero | one | two | few | many | other` (+ explicit `=N`) used by
  plural/selectordinal via `Intl.PluralRules`:
  <https://www.unicode.org/reports/tr35/tr35-numbers.html#Language_Plural_Rules>

Number/date/time map to native `Intl.NumberFormat` / `Intl.DateTimeFormat`.

> The one piece that **is** a formal, versioned Unicode spec is **MessageFormat 2.0**
> (UTS #35 Part 7: <https://www.unicode.org/reports/tr35/#Message_Format>). It is the
> named successor to "MF1" and is **deliberately out of scope** for yapyak today
> (MF2 is early-adoption/Stage-2-era; MF1 is the de-facto standard with universal
> tooling). yapyak targets the MF1 surface above.

---

## Compatibility matrix (EXACT — verified against `interpolate.ts`)

### ✅ Supported (parses + extracts + runtime-formats end-to-end)

| Feature | Syntax | Runtime | Intl mapping |
|---|---|---|---|
| Simple argument | `{name}` | `String(value)`, missing → `''` | — |
| Number (decimal) | `{x, number}` or `{x, number, decimal}` | default | `Intl.NumberFormat()` |
| Number integer | `{x, number, integer}` | `maximumFractionDigits: 0` | `Intl.NumberFormat` |
| Number percent | `{x, number, percent}` | `style: 'percent'` | `Intl.NumberFormat` |
| Number currency | `{x, number, currency EUR}` — **code required** (see deviation) | `style: 'currency'` | `Intl.NumberFormat` |
| Date | `{x, date}` / `{x, date, short\|medium\|long\|full}` (default `medium`) | `dateStyle` | `Intl.DateTimeFormat` |
| Time | `{x, time, short\|medium\|long\|full}` (default `medium`) | `timeStyle` | `Intl.DateTimeFormat` |
| Plural | `{x, plural, =N {…} zero/one/two/few/many/other {…}}` + `#` | `=N` exact match, then CLDR category, fallback `other` | `Intl.PluralRules` (cardinal) |
| Selectordinal | `{x, selectordinal, … other {…}}` | same as plural | `Intl.PluralRules` (ordinal) |
| Select | `{x, select, key {…} other {…}}` | branch by value, fallback `other` | — (branching) |
| Nesting | arguments inside plural/select/selectordinal branches | recursive | — |
| Tags / markup | `<link>…</link>` in `t()` | **literal text** (`ignoreTag: true`); rendered by `<RichText>`, not `t()` | — |

Accepted value types (from the type layer, `ExtractTParams`):
`number` args → `number`; `date`/`time` → `Date | number`; `select` → branch union
(`| (string & {})` when an `other` branch exists); plural/selectordinal → `number`.

**The owned surface, by example** (what you write in `t('…')`):

```ts
t('Hello {name}')                                          // simple
t('{n, number}')                                           // decimal
t('{n, number, integer}')                                  // 43
t('{n, number, percent}')                                  // 42%
t('{n, number, currency EUR}')                             // €9.50 / 9,50 €  (code required)
t('Updated {d, date, long}')                               // short | medium | long | full
t('At {d, time, short}')
t('{c, plural, =0 {no items} one {# item} other {# items}}')
t('{n, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}')
t('{role, select, admin {Admin} editor {Editor} other {Viewer}}')

// nesting — owned and verified (runtime + compiler):
t('{c, plural, one {# message from {author}} other {# messages from {author}}}')
t('{c, plural, one {{g, select, male {He} other {They}} sent # file} other {{g, select, male {He} other {They}} sent # files}}')
t('{role, select, admin {Admin {name}} other {User {name}}}')

// tags are LITERAL in t(); component interpolation is <RichText>:
t('Read our <link>terms</link> and <b>privacy</b>')
```

### ❌ Not supported → must be **rejected with a diagnostic** (parser accepts them, runtime does not)

| Feature | Example | Runtime behaviour today | Action |
|---|---|---|---|
| Number skeletons | `{x, number, ::currency/EUR}`, `{x, number, ::.00}` | ignored → plain decimal | reject (or extend, see below) |
| Legacy number patterns | `{x, number, #,##0.00}` | ignored → plain decimal | reject |
| Date/time skeletons | `{x, date, ::yyyyMMdd}` | ignored → `medium` | reject (or extend) |
| Date/time custom patterns | `{x, date, dd/MM/yyyy}` | ignored → `medium` | reject |
| Plural/selectordinal `offset:` | `{n, plural, offset:1 one {…} other {…}}` | mis-parsed | reject (or extend) |
| Apostrophe escaping | `'{'`, `''`, `'<'` | not handled → breaks scanning | reject (or extend) |

> The parser/runtime divergence on **escaping** is the most dangerous: FormatJS
> treats `'{'` as a literal brace, the runtime treats `{` as a token start. Must be
> caught at build, never shipped.

### ✅ Former deviations from the ICU spec (now resolved)

Both deviations that previously made yapyak silently spec-incorrect are fixed. Per
**Principle 2, neither may stay silent** — each now resolves to *correct or error*,
never silent-wrong:

| Was | Spec says | yapyak now |
|---|---|---|
| `#` inside plural emitted the **raw** `String(count)` (no locale formatting) | format the count per locale (`Intl.NumberFormat`), minus `offset` | formats the count per locale via `Intl.NumberFormat` (e.g. `1,234` / `1 234`). `offset` is **rejected at build**, so there is nothing to subtract — the spec result is reached. |
| `currency` without a code silently hardcoded **`USD`** (`… \|\| 'USD'`) | currency comes from the value/locale; `Intl` **throws** without a code | **build error** (`YPK010`) — an explicit code is required (`currency EUR`). The runtime `USD` fallback is removed; a code-less `currency` now degrades to the decimal default rather than guessing. |

---

## Validation: TypeScript vs compiler — exact reach & boundary

yapyak validates `t()` in two layers. Knowing **exactly** what each catches — and
where the type layer stops — is essential (and a docs page in itself).

### The crux: "params" is two different checks

| Check | Question | Who can do it |
|---|---|---|
| **Key presence** | did you pass `count`? | TS (best-effort) **and** compiler (authoritative, 100%) |
| **Value type** | is `count` a `number`? | **TS only** |

Value-type checking is **TS-exclusive and irreducible**: the compiler does
*syntactic* AST analysis (`ts.isObjectLiteralExpression` → reads key *names*); it
runs **no `TypeChecker`**. Knowing that `count` is a `number` needs type inference of
the value expression — a full `ts.Program` + `TypeChecker`, out of scope for a build
plugin. **Corollary:** replacing the TS literal-inference with a bare `Record` would
lose value-type checking *permanently* — no layer could take over.

### Division of labour (what is caught where)

| Category | Possible in TS? | TS catches | Compiler catches |
|---|---|---|---|
| Missing param / missing-of-several | ✅ | ✅ | ✅ `YPK002` |
| Extra / unknown param | ✅ | ✅ (object literal) | ✅ `YPK003` (literal) |
| **Wrong value type** | ✅ | ✅ `ExtractTParams` | ❌ (no TypeChecker) |
| Spread params `{...obj}` | ⚠️ | ⚠️ structural | ⚠️ `YPK005` (warn) |
| Params via a variable (not a literal) | ✅ if typed | ✅ | ❌ needs inline literal |
| Dynamic / empty source | ⚠️ (literal-guard trick) | ❌ (we delegate) | ✅ `YPK001` / `YPK008` |
| Plural missing `other` | ❌ impractical | ❌ | ✅ `YPK007` |
| Malformed / unsupported ICU | ❌ | ❌ | ✅ `YPK009`/`YPK010` (post-FormatJS) |
| Missing tag handler (`<RichText>`) | ✅ React/Svelte, ⚠️ Vue | ✅ React/Svelte; ⚠️ Vue = runtime-guard | ❌ (`<RichText>` opaque) |
| Translation-file checks (missing/stale/parity/migrate) | ❌ (TS can't read `.json`) | ❌ | ✅ |

Overlap is exactly **one** thing: param key-presence. Everything else is cleanly
split — TS owns the call-site *value* contract, the compiler owns structure +
the translation-file world.

### Where the TS type layer stops (empirically verified)

`ExtractTParams` / `ExtractTags` are recursive template-literal types. Reach,
measured against the real types with `tsc`:

| Source shape | Result |
|---|---|
| **Flat**, many placeholders (60 tested) | ✅ all extracted — top-level scan is *tail-recursive*, scales |
| **Shallow nesting** (1–2 levels, e.g. `{n, plural, one {# by {who}}}`) | ✅ all extracted |
| **Deep nesting**, ~10 levels | ⚠️ outer params extracted, **innermost dropped** (`a` ✅, `j` ✗ at depth 10) |
| **Deep nesting**, 25 levels | ⚠️ innermost dropped (`y` ✗) |

**It degrades gracefully — it does NOT crash.** No `TS2589`
("type instantiation is excessively deep") error, no *wrong* types — it returns a
**partial** param set (outer levels correct, deepest omitted). Reason: branch
recursion is **non-tail-recursive** (enter the branch body, *then* continue) → it
bottoms out within TS's instantiation budget; flat scanning is tail-recursive → it
does not.

Two further hard limits on "100% in TS":

- **Full grammar.** Apostrophe escaping and `#`-context need stateful char scanning,
  which template-literal types do extremely poorly — and those features are rejected
  at build anyway.
- **Performance.** A full ICU type-parser would lag `tsserver`/`tsc` at app scale.

### Boundary statement (docs-ready)

> TypeScript catches **value types** and **param presence** for flat and
> shallowly-nested messages — the ~99% you actually write — instantly, with no
> codegen. For deeply-nested ICU the type layer extracts the outer params and
> gracefully omits the innermost (no error, no wrong type). The **compiler** then
> validates **every** param name at **every** depth, in every framework, and fails
> the build on a mismatch. Nothing is lost: TS gives instant editor feedback plus the
> value-type layer; the compiler is the 100% backstop.

### Design principle

Do **not** push the type layer toward 100% nesting. It (a) cannot be done cleanly
(non-tail-recursive → graceful partial), (b) is unnecessary (the compiler backstops
deep names at 100%), and (c) would cost editor performance for the 99% common case.
TS owns **value-types + instant feedback for flat/shallow**; the compiler owns
**all names, all depths, build-gated**. That split is the only one that is both
physically possible and fast.

---

## Implementation steps

1. Add `@formatjs/icu-messageformat-parser` to `@yapyak/compiler` **dependencies**
   (build-time only).
2. `parser/placeholder.ts`: replace `walkSource`/`parsePlaceholderInner` with
   `parse(source, { ignoreTag: true, requiresOtherClause: true, captureLocation: true })`.
   Map the AST → the existing `PlaceholderInfo[]` shape (so `argument.ts` and
   `transform.ts` are untouched). Recurse into plural/select option values for
   nested placeholders.
3. **Add `selectordinal` to `PlaceholderKind`** (today it is lumped as `plural` —
   a fidelity loss).
4. **Gate to the supported subset:** walk the AST; if an element uses an
   unsupported feature (skeleton, custom pattern, `offset:`, escaping) → emit a
   diagnostic instead of silently passing.
5. New diagnostics:
   - `YPK009` — **malformed ICU** (parse `SyntaxError`, with `location`).
   - `YPK010` — **unsupported ICU feature** (skeleton / `offset:` / escaping).
   - Map FormatJS `MISSING_OTHER_CLAUSE` → existing **`YPK007`** (keep the friendly
     "plural missing `other`" message).
6. Update `parser/placeholder.test.ts` (several "silently accepted garbage" cases
   now correctly error — that is the point).
7. **Unchanged:** the runtime (`interpolate.ts`) and `transform.ts`'s single-locale
   elision (the supported subset is stable, so neither needs to change for Fas 1).

After the swap, the intro-copy claim *"invalid ICU → the build fails"* becomes
**true** (today it is not).

### AST → `PlaceholderInfo` + gating (exact — verified against the parser AST)

`parse(source, { ignoreTag: true, requiresOtherClause: true, captureLocation: true })`,
then per element. **Key finding:** FormatJS does *not* validate number/date style
strings — `currency EUR`, `#,##0.00`, even `banana` all parse with `style` as a raw
string. Only skeletons (`::…`) come back as a `style` **object**. So **style
validation is ours**; skeletons are the one thing the parser distinguishes for us.

| AST element | Condition | Result |
|---|---|---|
| `literal`, `pound` (`#`) | — | ignore |
| `argument` | — | `{ kind: 'simple', name }` |
| `number` | `style` is an **object** (skeleton `::…`) | **reject** `YPK010` |
| `number` | `style` string ∉ { `decimal`, `integer`, `percent`, `currency <CODE>` } (legacy patterns; `currency` w/o code) | **reject** `YPK010` |
| `number` | allowed style | `{ kind: 'number', name }` |
| `date` / `time` | `style` object, or string ∉ { `short`, `medium`, `long`, `full` } | **reject** `YPK010` |
| `date` / `time` | allowed style | `{ kind: 'date' \| 'time', name }` |
| `plural` (cardinal/ordinal) | `offset !== 0` | **reject** `YPK010` |
| `plural` (cardinal/ordinal) | else | kind by `pluralType` (`cardinal`→`plural`, `ordinal`→`selectordinal`); recurse `options[*].value` for nested params |
| `select` | — | `{ kind: 'select', name }`; recurse options |
| `tag` | (absent with `ignoreTag: true`) | — |

Plus two source-level gates (the parser resolves these *silently*, so we pre-scan the
raw source):

- **Escaping** — source has `'` followed by `{ } # <`, or `''` → **reject** `YPK010`
  (the parser turns `'{x}'` into literal `{x}`, but the runtime would interpolate it →
  divergence).
- **Parse error** — `parse()` throws → `YPK009` (with `location`); route the
  `MISSING_OTHER_CLAUSE` error kind to the existing **`YPK007`**.

## Test coverage (the contract IS the test suite)

"We own what we support and reject everything else" is only true if **every row of
the matrix has a test.** The suite mirrors the contract exactly:

- **Supported (✅)** — for each example in *The owned surface, by example*, assert the
  parser yields the correct `PlaceholderInfo` (name + kind), including nested.
  → `parser/placeholder.test.ts`
- **Rejected (❌)** — for each unsupported input (number/date skeleton, legacy pattern,
  `offset:`, escaping, `currency` without a code, malformed, empty, dynamic source,
  plural missing `other`), assert the **exact diagnostic code** fires.
  → `parser/placeholder.test.ts` / `parser/argument.test.ts`
- **Runtime** — an `interpolate` battery: every supported feature renders correctly
  per locale (en + sv), incl. nesting. → `translation/interpolate.test.ts` **(does not
  exist yet — must be added; runtime formatting is currently unit-untested).**
- **Types** — value-type + presence + nesting reach/boundary.
  → `t-param.test-d.ts` (params) + `tag.test-d.ts` (tags) — already present.
- **Invariant test** — assert that the set of ✅/❌ examples in the matrix equals the
  set covered by tests, so no supported/rejected row can be added without a test.

That is the "we own it" guarantee: the matrix and the test suite are the same artifact.

## Open decisions

- **Extend vs reject** for skeletons / `offset:` / escaping. Strong candidate to
  **extend** rather than reject: **number/date skeletons**, since
  `@formatjs/icu-skeleton-parser` maps skeletons → `Intl` options — that is exactly
  "1:1 with Intl" and would let us support `::currency/EUR` etc. Recommendation:
  reject now (clear errors, ship correctness), extend skeletons next if demanded.

Resolved (see *Former deviations* above): **`#` formatting** (now locale-formatted
via `Intl.NumberFormat`) and the **`currency` default** (code now required at build;
`USD` fallback removed).

## Docs to write from this

- "Supported ICU syntax" page = the ✅ matrix above (with examples + Intl mapping).
- "Unsupported / rejected" callout = the ❌ table, so users know what fails the
  build and why.
- Note that **tags in `t()` are literal** and that component interpolation is
  `<RichText>` (cross-link).
- A short "ICU is parsed and validated at build by the reference parser" trust
  statement (only once Fas 1 lands).
- A **"Type safety: what TS catches vs the compiler"** page from the *Validation*
  section above — the two-checks crux, the division-of-labour table, and the
  empirical TS reach/boundary (flat scales, deep nesting degrades gracefully,
  compiler is the 100% backstop). This is a strong, honest differentiator to
  document, not a caveat to hide.
