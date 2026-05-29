# Plan: typed message API (`t` structure + `format` values)

> Status: **design locked. Type model proven.** Message authoring moves from ICU
> strings (`t('...')`) to a typed, composable tagged-template DSL where every
> interpolation is a single-key object `${{ name: value }}`. Goal: *every message,
> every nesting depth, fully type-checked — with no generated type files.*
> Drafted 2026-05-29. Supersedes the authoring half of `formatjs-icu-plan.md`. The
> runtime formatting subset and the `_pick` locale machinery still stand; only the
> authoring and extraction layers change.

Legend: **[proven]** = verified with the project's compilers. **[proposed]** = to build.

## Positioning (worded precisely)

Every other type-safe i18n library (typesafe-i18n, t3, …) needs a **codegen step**:
generate `.d.ts` from your messages, keep them in sync, run a watcher. yapyak needs
**no generated type files and no type watcher** — types are inferred from the literal
at the call site by TypeScript itself.

Be precise: yapyak still has a **build/dev compiler** (the Vite plugin) that extracts
messages, generates ICU, builds catalogs, and validates. The claim is **"fully typed
messages, no generated type files, no type watcher"** — *not* "no build step." The
product's magic lives in that compiler; the *types* just don't require a separate
generated artifact.

## The problem this solves

`t('You have {count, plural, one {# item by {author}} other {…}}', { count, author })`
makes TypeScript *parse an ICU string* with recursive template-literal types — the one
thing TS is bad at. It fails in ways that are not "degraded" but wrong **[proven]**:

| Source shape | TS extracts | |
|---|---|---|
| `{count, plural, one {# by {author}} …}` | `{ count, author }` | ✅ |
| `{count, plural, one {{g, select, …}} …}` | `{ count, g, `**`"{g"`**` }` | ❌ phantom key |
| `{c0, plural, other {{c1, plural, …}}}` | `{ c0 }` — inner dropped | ❌ |

The wall is TS's type-level recursion (instantiation budget, non-tail recursion,
brittle brace-adjacency) — **not** the ICU syntax. So *no* string format can inherit
types at depth. The only escape is to stop parsing a string and express the message as
**typed values**.

## The reframe

Express the message as typed values and composable functions. TS types every param
natively (names by object key, values by helper signatures) at any depth. The
**compiler reconstructs (generates) the ICU string from the AST** for the catalog and
translators. Each tool does what it is good at; the brittle middle is deleted.

## Two namespaces

```ts
import { t, format } from 'yapyak'; // or '@yapyak/react' etc. for rich (see Rich text)
```

- **`t`** — message **structure / nodes**: the `` t`…` `` tag, `t.number`, `t.currency`,
  `t.date`, `t.time`, `t.plural`, `t.selectordinal`, `t.select`, `t.rich`, `t.in`.
  Everything under `t` becomes part of the translatable message.
- **`format`** — **value to string, now**: `format.number`, `format.currency`,
  `format.date`, `format.time`, `format.list`, `format.relativeTime`, `format.dateTime`.
  Standalone display formatting, returns a string in the active locale.

### Why `t.number` exists separately from `format.number`

In the common case (render in the active locale) they look identical. The real
difference: `t.number` is a **node** — it formats in the **message's** locale, appears
in the catalog as `{amount, number, percent}` (the translator sees it is a percent),
and stays a localizable part of the message. `format.number` produces a **frozen
string** in the **active** locale. Under a forced locale (`t.in('de')`) `format.number`
would format the number in the wrong locale — a localization bug. So: **inside a
message use `t.*`; outside use `format.*`.** Using `format.*` inside a message is a
**build error** (no silent freezing).

## The object form

Every interpolation is a single-key object `${{ name: value }}`, or shorthand
`${{ name }}`. The object **key is the placeholder name** (static, written into the
catalog); the **value is any expression** (resolved at runtime).

```ts
t`Hello, ${{ name: user.profile.name }}!`;  // {name}
t`Hello, ${{ name }}!`;                       // shorthand
```

Why the object form — and why not bare `${name}`:

- **The name must reach the type system, and only an object key can carry it.** A
  tagged template's static text comes through as `TemplateStringsArray`, **not** a
  literal type **[proven]** — so neither `${name}` nor tag-text markup can give TS the
  name. An object key *is* a literal type. This is what makes typed rich-text tags
  possible at all.
- **One rule, editor-enforced.** A bare `${x}` is a **type error** **[proven]** (a
  scalar is not a `Hole`) — the editor flags it immediately.
- **Name decoupled from the value expression** → renaming the value doesn't change the
  key. Key stability.

**[proven]** findings (object-form PoC through the project `tsc`): shorthand works;
computed values work (`${{ plan: params[x] }}`); `t.plural`/`t.select` enforce value
types + required `other`; non-interpolatable values are rejected; **bare interpolation
is a type error**; a **multi-key** hole *compiles* (TS can't require one key) → the
**compiler** enforces single-key.

## Every function

### `` t`…` `` — the message **[proven]**
```ts
t`Save changes`;                              // "Save changes"
t`Welcome back, ${{ name: user.name }}!`;     // "Welcome back, {name}!"
```

### scalar hole — plain interpolation
```ts
t`Logged in as ${{ email: session.email }}`;  // {email}; String(value), missing → ''
```

### `t.number(value, style?)` / `t.currency(value, code)` **[proven]**
```ts
t`Total: ${{ pct: t.number(ratio, 'percent') }}`;       // {pct, number, percent}
t`${{ views: t.number(n, 'integer') }} views`;          // {views, number, integer}
t`Price: ${{ total: t.currency(cart.total, 'EUR') }}`;  // {total, number, currency EUR}
```

### `t.date(value, style?)` / `t.time(value, style?)` **[proven]**
```ts
t`Updated ${{ at: t.date(row.updatedAt, 'long') }}`;   // {at, date, long}
t`Starts ${{ at: t.time(event.startsAt, 'short') }}`;  // {at, time, short}
```

### `t.plural(count, branches)` — `other` required, `#` literal, numeric exact keys **[proven]**
```ts
t`You have ${{ count: t.plural(folder.fileCount, {
  0:     t`no files`,        // numeric key → exact =0
  one:   t`# file`,          // # = locale-formatted count
  other: t`# files`,
}) }}`;
// {count, plural, =0 {no files} one {# file} other {# files}}
```

### `t.selectordinal(count, branches)` — same shape, ordinal rules **[proven]**
```ts
t`You came ${{ place: t.selectordinal(rank, {
  one: t`#st`, two: t`#nd`, few: t`#rd`, other: t`#th`,
}) }}`;
// {place, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}
```
The API name mirrors the ICU keyword exactly — `t.plural`↔`plural`, `t.select`↔`select`,
`t.selectordinal`↔`selectordinal` — so what you write matches the catalog and the
ecosystem. (`selectordinal` is an ICU misnomer — it behaves like plural — but matching
the established keyword beats inventing `t.plural.ordinal`.)

### `t.select(value, branches)` — string keys, `other` required, no `#` **[proven]**
```ts
t`${{ role: t.select(user.role, {
  admin: t`Administrator`, editor: t`Editor`, other: t`Viewer`,
}) }}`;
// {role, select, admin {Administrator} editor {Editor} other {Viewer}}
```

### `t.rich(content)` — markup node, named by the key **[proposed]**
```ts
t`Read our ${{ link: t.rich(t`terms`) }}`;   // <link>terms</link>; renders via <RichText> (see below)
```

### `t.in(locale)` — forced locale
```ts
t.in(recipient.locale)`Your order ${{ id: order.ref }} shipped`;
```

### `format.*` — render now → string (active locale)
```ts
format.number(1234.5);              // "1,234.5"
format.currency(cart.total, 'EUR'); // "€1,234.50"
format.date(order.createdAt, 'long');
format.list(['a', 'b', 'c']);       // "a, b, and c"
format.relativeTime(-3, 'day');     // "3 days ago"
```

## Naming = the object key

The placeholder name is always the object key — explicit, static, decoupled from the
value. No `t.value` escape, no AST name-inference, no trailing-property heuristic. The
catalog id is a hash over the **normalized positional** structure **[proposed]** so a
key rename does not orphan a translation; param names are display metadata.

## Rich text — `t.rich` node + `<RichText>` per framework

Rich markup has an irreducible split: the **structure** (`<link>terms</link>`,
translatable, agnostic, in the catalog) vs the **rendering** (`<a href>` / a component,
framework-specific, in the code). The structure is uniform; the rendering is
framework-native.

**Message (uniform, agnostic):**
```ts
const msg = t`Read our ${{ link: t.rich(t`terms`) }} and ${{ b: t.rich(t`privacy`) }}`;
// type: RichMessage<'link' | 'b'>   — the brand carries the tag names
```

**Render via `<RichText>`, native handlers per framework:**
```tsx
// React — render-fn props
<RichText message={msg} link={(c) => <a href="/terms">{c}</a>} b={(c) => <strong>{c}</strong>} />
```
```vue
<!-- Vue — named slots -->
<RichText :message="msg">
  <template #link="{ children }"><a href="/terms">{{ children }}</a></template>
  <template #b="{ children }"><strong>{{ children }}</strong></template>
</RichText>
```
```svelte
<!-- Svelte 5 — snippets -->
<RichText {message}>
  {#snippet link(c)}<a href="/terms">{@render c()}</a>{/snippet}
  {#snippet b(c)}<strong>{@render c()}</strong>{/snippet}
</RichText>
```
```astro
<!-- Astro — named slots -->
<RichText message={msg}>
  <a slot="link" href="/terms"><slot /></a>
  <strong slot="b"><slot /></strong>
</RichText>
```

The slot/handler names come from the message brand `RichMessage<'link' | 'b'>`. Tags
work inside plural/select too:
```ts
t`${{ count: t.plural(unread, {
  one:   t`You have ${{ link: t.rich(t`# new message`) }}`,
  other: t`You have ${{ link: t.rich(t`# new messages`) }}`,
}) }}`;
```

**Type-enforcement gradient (honest, framework-driven):** React **full** (missing
handler → compile error), Svelte 5 **strong** (typed snippets + generics), Vue
**partial** (typed named slots, but "required + generic over the message prop" is
limited), Astro **weak** (slots not typed by name). The brand carries the names
everywhere; how hard the *missing-handler* check bites is the framework's slot typing.

**`t` is framework-aware for rich** **[proposed]**: a message containing `t.rich`
returns the framework's node type (`ReactNode`, …), so `t` for UI is imported from
`@yapyak/react` / `@yapyak/svelte` / `@yapyak/vue`. Plain string messages are identical
across them; core `yapyak` exports a string-only `t` for non-UI contexts.

## In-message vs standalone `format`

`format.*` standalone is rich (full Intl options, returns a string). Inside a message,
only ICU-expressible nodes are allowed — and those are `t.*`, not `format.*`. Using
`format.list`/`format.relativeTime`/rich options inside a message is a **build error**
("cannot be expressed as an ICU message argument"), never a silent freeze.

## Compiler: AST → ICU **[proposed]**

Walk the (static) tagged-template AST and generate standard ICU. yapyak *generates*
ICU; it does not parse user ICU.

| AST node | ICU |
|---|---|
| quasi (static text) | literal text (`{`,`}` escaped; see Escaping) |
| `${{ name: value }}` (scalar) | `{name}` |
| `${{ n: t.number(x, 'percent') }}` | `{n, number, percent}` |
| `${{ n: t.currency(x, 'EUR') }}` | `{n, number, currency EUR}` |
| `${{ n: t.date(x, 'long') }}` | `{n, date, long}` |
| `${{ n: t.plural(x, { 0, one, other }) }}` | `{n, plural, =0 {…} one {…} other {…}}` |
| `# file` (branch text) | `# file` |
| `${{ n: t.selectordinal(x, { … }) }}` | `{n, selectordinal, …}` |
| `${{ n: t.select(x, { … }) }}` | `{n, select, … other {…}}` |
| `${{ tag: t.rich(content) }}` | `<tag>content</tag>` |

Build errors: bare interpolation, multi-key hole, `format.*` in a message, a non-inline
DSL (see Strict static inline).

## Catalog format

Standard named ICU. The DSL → catalog mapping is 1:1.

```jsonc
// locales/sv.json
{
  "Save changes": "Spara ändringar",
  "Hello, {name}!": "Hej, {name}!",
  "You have {count, plural, one {# file} other {# files}}":
    "Du har {count, plural, one {# fil} other {# filer}}",
  "You came {place, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}":
    "Du kom {place, selectordinal, other {#:e}}",
  "Read our <link>terms</link>": "Läs våra <link>villkor</link>"
}
```

## Runtime

The compiler lowers `` t`…` `` to the **same `_pick(catalog, params)`** yapyak uses
today (proven, existing). `_pick` selects the active/forced locale's string and
interpolates by **name** — so a reordered translation (`"{name}, välkommen till
{place}!"`) places each value correctly. The object form is what makes the name travel
with the value to the runtime. Number/date/plural format in the message's locale via
the existing tiny `interpolate`. Only authoring + extraction are new; the locale
machinery is unchanged.

## Vue `}}` collision — already handled

`${{ … }}` ends in `}}`, which collides with Vue's `{{ }}` mustache **[proven]** — but
this is **not new**: the existing ICU-string form (`t('…{plural…}}')`) collides
identically (verified — raw `@vue/compiler-dom` truncates both at the inner `}}`).
yapyak's Vue processor already has a `}}`-aware mustache scanner (`skipString`,
`skipTemplateLiteral`, `skipBalancedBraces`) that extracts the full call, **and that
scanner already handles `${{ … }}`** (`skipTemplateLiteral` → `skipBalancedBraces`).
The Vue example (inline plurals in `{{ }}`) builds today. So the DSL inherits the
existing handling — zero new Vue work.

## FormatJS leaves the authoring path

`@formatjs/icu-messageformat-parser` existed to **parse user-written ICU source** and
validate it. In the DSL, no one writes ICU source — the compiler *generates* it.
Missing `other` is a TS error; unsupported features are unexpressible (closed API);
malformed is impossible. So all source validation (YPK007/009/010) is replaced by the
typed closed API. The transform inlines translation strings verbatim; the runtime has
its own tiny parser. **FormatJS is no longer needed on the authoring/compiler path.**
The only remaining candidate use is validating human/AI-edited **translations** (CLI
`check`) — keep FormatJS there (build-time only) or replace with a small subset-
validator, since the source structure is known. (Open decision.)

## Strict static inline (v1)

The DSL must appear **inline** in a `` t`…` `` for extraction. You may store the
**result** in a variable; you may not assemble a message from variable **pieces**:
```ts
const msg = t`You have ${{ count: t.plural(n, { one: t`# file`, other: t`# files` }) }}`; // ✓ inline
const branches = { one: t`# file`, other: t`# files` };
t`You have ${{ count: t.plural(n, branches) }}`;  // ✗ v1: branches in a variable
```
Documented as a strength: messages are statically authored, statically extracted,
statically verified.

## Escaping (contract — we generate ICU, so this is core)

- Literal `{` / `}` in template text are always literal (placeholders are only
  `${{ … }}`). The generator escapes them in ICU (`Use {curly}` → `Use '{'curly'}'`);
  the runtime renders them back. The author never thinks about it.
- `#` is the count only inside plural/selectordinal branches; literal elsewhere. A
  literal `#` inside a branch is escaped (`'#'`).

## Migration

```ts
// t('Save changes')                              →  t`Save changes`
// t('Hello, {name}!', { name })                  →  t`Hello, ${{ name }}!`
// t('{n, number, percent}', { n })               →  t`${{ n: t.number(n, 'percent') }}`
// t('Updated {d, date, long}', { d })            →  t`Updated ${{ d: t.date(d, 'long') }}`
// t('{c, plural, one {# item} other {# items}}', { c })
//                                                 →  t`${{ c: t.plural(c, { one: t`# item`, other: t`# items` }) }}`
// t('{g, select, female {her} other {their}}', { g })
//                                                 →  t`${{ g: t.select(g, { female: t`her`, other: t`their` }) }}`
// t('Hi {name}', props)  (dynamic params)         →  t`Hi ${{ name: props.name }}`
// <RichText value={t('… <link>x</link> …')} link={…} />
//                                                 →  t`… ${{ link: t.rich(t`x`) }} …`  +  <RichText> per framework
// formatNumber(x, { style: 'percent' })           →  format.number(x, 'percent')   (standalone)
```

## What this resolves

- **Deep nesting** types completely; no phantom keys, no dropped params. **[proven]**
- **Value types** enforced by helper signatures; no string parsing. **[proven]**
- **The dynamic-params thread** — gone. No params bag; `${{ name: expr }}` is typed.
  No YPK005, no `dynamic()`, no per-call suppression, no config.
- **Zero generated type files**; everything inferred.
- **FormatJS** off the authoring path.

## Trade-offs (honest)

1. **Not ICU at the authoring layer.** A bespoke (if ICU-modelled) syntax; newcomers
   learn it. The catalog stays ICU, but you cannot copy-paste catalog ICU into code.
2. **`${{ }}` is two extra braces** vs `${name}` — a deliberate trade for one rule,
   name-in-type (rich text), and editor-enforced bare-is-error.
3. **`t` is framework-aware for rich** — UI `t` imported per framework.
4. **Rich-text type-enforcement is a framework gradient** (full React/Svelte, partial
   Vue, weak Astro).
5. **Bigger, more bespoke compiler/runtime** than parse-ICU-and-interpolate, and a
   **total migration** of every call, example, and the docs site.

## Open decisions

- Translation validation: keep FormatJS (build-time) or a subset-validator.
- `format.currency` vs `format.money` (leaning `currency`).
- Normalized-positional id: confirm as the catalog id mechanism.

## Implementation phases **[proposed]**

1. **Lock the type model** — `t` / `Hole` / `format` / node + a full `.test-d.ts`
   battery proving every guarantee (the PoCs expanded), incl. the `t.rich` brand-flow
   (`RichMessage<Tags>` → `<RichText>` requires handlers).
2. **Runtime** — `t` tag + node markers + `format` (rename existing) + source/translated
   rendering; framework-aware `t` per package.
3. **Compiler** — AST → ICU, object-key names, `#` literal, escaping, normalized id,
   plus the bare / multi-key / `format`-in-message / non-inline build errors.
4. **Catalog + translator path** — named ICU, unchanged interface; decide FormatJS's
   fate for translation validation.
5. **Migrate** examples, docs, the docs site; ship `<RichText>` per framework.
