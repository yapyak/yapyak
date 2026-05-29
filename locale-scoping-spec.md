# Spec: locale scoping via `.in()`

Decision-complete build spec. Code-accurate against the current compiler/runtime.

## Background — why this exists, and why *not* the DSL

The typed-message DSL (`t\`...${{ }}\``) is **retracted**. ICU strings stay, for four
reasons that are decisive for an i18n *library*:

1. **ICU is the standard.** Every TMS (Crowdin, Lokalise, Phrase), i18next, FormatJS and
   machine translation speak ICU. A bespoke TS DSL is an island — translators and tooling
   can't touch it.
2. **Greppability.** A static `'You have {count, …}'` is findable by searching the rendered
   text. DSL fragments split across template chunks are not.
3. **AI authoring** deflates the DSL's only real edge (authoring DX) — an AI writes a correct
   ICU string as easily as a DSL expression.
4. **Compiler-first already validates** ICU at build (`YPK` diagnostics), so the only thing
   ICU strings give up vs the DSL — type-level params on *deeply nested* ICU — is still
   build-safe. Cheap loss.

What we keep from that exploration is one genuinely good ergonomic idea: **locale scoping via
`.in(locale)`**, for both `t` and `format`. This spec adds exactly that, on top of the
existing ICU-string API. The "Fas 1" FormatJS parser swap stays — it's the foundation.

## 0. The one rule (unchanged)

> The first argument to any translator call — `t`, an alias, or a `.in()`-scoped translator —
> MUST be a static string literal.

Enforced today by `parseArguments` → `DynamicSourceError`. `.in()` does not change it.
**Locale, by contrast, may be any expression** (literal or dynamic) — it is a runtime concern,
not an extraction concern. The catalog is locale-independent.

## 1. Public API

### 1.1 `t.in(locale)`

```ts
import { t } from 'yapyak';

t('Hello');                                   // ambient locale
t.in('sv')('Hello');                          // forced sv, inline
const sv = t.in('sv');                        // first-class value — passable
sv('Hello');
sv('Hi, {name}!', { name });                  // reused
t.in(user.locale)('Welcome back, {name}!', { name }); // dynamic locale — fine
```

- `t` keeps its source-literal param-type extraction.
- `in(locale: string): typeof t` — chainable, last wins (`t.in('sv').in('en')` → `en`).
- **The per-call `{ locale }` options argument is removed.** Signature becomes
  `t(source, params?)`. Locale forcing is *exclusively* `.in()`. Migration:
  `t('x', p, { locale: l })` → `t.in(l)('x', p)`.

### 1.2 `format.in(locale)` + pure `Intl` options

```ts
import { format } from 'yapyak';

format.number(1000);                          // ambient
format.in('sv').number(1000);                 // forced sv
const sv = format.in('sv');
sv.number(1000);
sv.currency(200, 'SEK');
```

- `format` becomes a single object: `number`, `currency`, `percent`, `date`, `time`,
  `dateTime`, `list`, `relativeTime`.
- `in(locale: string): Format` — locale-bound copy.
- **Option types are pure `Intl.*Options`** — the `& { locale }` extension is dropped, the
  `Intl` type stays intact. The free functions (`formatNumber`, …) are removed; `format.*` is
  the one API.
- **Pure runtime — the compiler never touches `format`.**

## 2. Runtime

### 2.1 `t` — `packages/yapyak/src/translation/t.ts`

- Refactor `t` from a `function` declaration to a callable `Tag` value (callable interface +
  `in`), preserving the generic source-literal param extraction (`t-param.ts`).
- `makeTag(boundLocale?: string): Tag` — returns a callable; resolves
  `boundLocale ?? getLocale()`; renders via `interpolate(source, params, locale)`. Runtime `t`
  interpolates the **source** — translation is the compiler's job, unchanged. `in` →
  `(locale) => makeTag(locale)`. `export const t = makeTag()`.
- Remove `TOptions` and the options arg.
- Runtime locale affects ICU formatting (numbers/plurals/dates), not translation lookup —
  identical to today's `t`. A `.in()` call that escapes compilation degrades to
  source-string + locale formatting, exactly as `t` does today. No new silent gap. (Optional:
  dev-only "untranslated" warning — separate concern.)

### 2.2 `format` — `packages/yapyak/src/format/`

- Add `makeFormat(boundLocale?: string): Format` returning the object; each method resolves
  `boundLocale ?? getLocale()` and calls the underlying formatter with **pure** `Intl`
  options. `in` → `(l) => makeFormat(l)`. `export const format = makeFormat()`.
- Refactor each per-type formatter to take `(value, locale, options)` (locale explicit)
  instead of reading it out of options via `resolveLocale`. Drop `& { locale }` from the
  option types.
- Remove the free-function exports (`formatNumber`, …) from the public surface.

## 3. Compiler — `packages/compiler/src/parser/`

The existing passes already do scope-aware binding tracking. `.in()` extends three of them.
**Extraction reuses everything** once `.in` call sites are discovered — it is
locale-independent.

### 3.1 `binding.ts` — recognize scoped aliases

- `registerVariableDeclarations` today handles `const x = <identifier>` (re-alias → kind
  `'wrapper'`). Add: `const x = <base>.in(<localeExpr>)` where `<base>` resolves to a
  `t`-binding (`direct` / `wrapper` / `scoped`) →
  - new `Binding.kind === 'scoped'`,
  - new field `localeExpression: ts.Expression` (the `.in()` argument node).
- Chained `.in` (`const en = sv.in('en')`) falls out naturally — `<base>` resolves to scoped
  `sv`, the new scoped binding carries the new locale expr (last wins).

### 3.2 `call.ts` — discover `.in` call sites

- `CallSite` gains `localeExpression?: ts.Expression`.
- `resolveCallee` adds two branches:
  - **inline** — callee is a `CallExpression` matching `<base>.in(<localeExpr>)` where
    `<base>` resolves to a `t`-binding → the OUTER call is a translator call; capture
    `localeExpression`.
  - **scoped identifier** — callee identifier resolves to a `'scoped'` binding → translator
    call; `localeExpression` from the binding.
- Existing `t(...)` / `tt(...)` / `yapyak.t(...)` paths unchanged.

### 3.3 `transform.ts` — thread locale into `_pick`

- `renderCallReplacement`: when `callSite.localeExpression` is present, synthesize the options
  arg `{ locale: <localeExpr text> }` and emit it as the 3rd `_pick` argument — reusing the
  existing `optionsExpression` slot and positioning.
- `canElide` must return `false` when `localeExpression` is present, mirroring the existing
  `parsed.optionsExpression` guard (a forced locale cannot be elided).
- Message extraction, catalog building, message-id, param handling: **unchanged** — arg 0 of
  the outer call is still the message literal.

### 3.4 The static-string rule

- `parseArguments` reads the message from arg 0 of `callSite.node`; for `.in` calls that's the
  outer call's arg 0 → same literal-or-`DynamicSourceError` enforcement, for free. No new
  diagnostic, no escape error.

## 4. Locked decisions

| # | Decision |
|---|---|
| D1 | `.in()` REPLACES the per-call `{ locale }` option. `t(source, params?)` — no options arg. |
| D2 | Locale expr may be ANY expression (literal or dynamic). Message arg 0 must be a static literal (the one rule). |
| D3 | A scoped translator (`sv`) is a first-class value — passable, no special restriction. Same powers and same boundary as `t`. **No escape build-error.** |
| D4 | Cross-boundary / un-compiled `.in` calls degrade to source-string + locale formatting at runtime — identical to `t` today. |
| D5 | `format` is pure runtime; the compiler never touches it. Option types are pure `Intl.*Options`. |
| D6 | Re-aliasing and chaining (`const y = x`, `x.in('en')`) supported within a file, scope-aware. Last `.in` wins. |
| D7 | Per-file analysis only (matches Vite). Exported/imported scoped translators run via the runtime fallback. |
| D8 | Namespace form `yapyak.t.in('sv')(...)`: support if cheap, else document "use the named import". Decide during 3.2. |

## 5. Test plan

**Compiler** (`packages/compiler`):
- `t.in('sv')('Hello')` → `_pick(catalog, undefined, { locale: 'sv' })`.
- `const sv = t.in('sv'); sv('Hello')` → same.
- `sv('Hi, {name}!', { name })` → `_pick(catalog, { name }, { locale: 'sv' })`.
- dynamic locale `t.in(x)('Hi')` → `{ locale: x }`.
- chained `const en = sv.in('en'); en('x')` → `{ locale: 'en' }`.
- re-alias `const s2 = sv; s2('x')` → `{ locale: 'sv' }`.
- block-scope shadowing of `sv` respected.
- `sv(dynamicVar)` → `DynamicSourceError` (message rule holds).
- a `.in` call is never elided, even in single-locale builds.
- `f(sv)` (escape) does not crash the pass; the internal call is left to runtime — no
  extraction, no error.

**Runtime** (`packages/yapyak`):
- `t.in('sv')('{n, number}', { n: 1000 })` formats in sv.
- `t.in('sv')` is a reusable callable.
- `format.in('sv').number(1000)` vs `format.number(1000)`.
- `format.in('sv').currency(200, 'SEK')`.

**Types** (`.test-d.ts`):
- `t.in('sv')` is `typeof t` (param extraction preserved through `.in`).
- `format.in('sv')` is `Format`.
- `format.number`'s options param is exactly `Intl.NumberFormatOptions | undefined` (no
  `& { locale }`).

## 6. Phases

1. **Runtime `format.in` + pure `Intl` options** — smallest, isolated, no compiler. Refactor
   `format` → object + `.in`, drop `& { locale }`, remove free fns, tests.
2. **Runtime `t.in`** — `t` → callable `Tag` + `.in`, drop options arg, tests.
3. **Compiler `.in` support** — `binding.ts` scoped kind, `call.ts` discovery, `transform.ts`
   locale threading; full compiler test battery.
4. **Migrate** existing `{ locale }` call sites + `formatX` usages; docs.
5. **Verify** — typecheck, lint, full test suites, an end-to-end build.

## 7. Teardown (dead DSL)

- Delete `packages/yapyak/src/translation/dsl/` (retracted typed-message DSL).
- Delete `typed-message-api-plan.md` + the old `typed-message-api-spec.md` (retracted design;
  the rationale is preserved in this spec's Background).
- Keep everything Fas 1 touched (FormatJS parser swap, `interpolate`, `t-param`, compiler
  diagnostics) — it is the ICU-string foundation.
