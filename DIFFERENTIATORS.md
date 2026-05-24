# Differentiators

Living doc of features yapyak ships that no other i18n library — in any framework — supports today. Use as source material for landing-page copy, READMEs, release notes, and reviewer talking points.

Every claim here has been verified against the current i18n landscape (FormatJS/react-intl, react-i18next/i18next, Lingui, next-intl, Paraglide, vue-i18n, svelte-i18n, astro-i18n, Tolgee, plus relevant AI-translate tooling). Table-stakes features (URL persistence, JSON catalogs, optional peer deps, framework-split packages) are deliberately omitted — claiming those as differentiators damages credibility with anyone who knows the space.

---

## Vue: ICU plurals and selects work directly in `{{ }}` mustaches

### The problem

Vue's template parser tokenizes `{{ ... }}` by scanning for the first `}}` it sees. It is not JS-aware. Any string literal containing `}}` inside a mustache breaks the parser.

ICU MessageFormat — the industry-standard plural and select syntax — terminates every nested branch with `}`. A plural call ends with `}}` (closing the last branch, then closing the placeholder). The conflict is structural, not edge-case:

```vue
<p>{{ $t('You have {count, plural, one {# msg} other {# msgs}}', { count }) }}</p>
```

Vue's parser sees the `}}` after `messages` as the end of the mustache. It truncates the expression to `$t('You have {count, plural, one {# msg} other {# msgs`, fails to parse the unterminated string, and emits:

```
Error parsing JavaScript expression: Unterminated string constant
```

This is a long-standing, well-known limitation in `@vue/compiler-sfc`.

### What every other library does about it

| Library | Workaround |
|---|---|
| **vue-i18n** | Lift to `<script setup>`, use `<i18n-t>` component, or use `v-text` attribute |
| **FormatJS** (Vue integration) | Same lift / wrap-in-component dance |
| **Lingui** | No Vue support |

vue-i18n's `<i18n-t>` component exists specifically because raw ICU in mustaches collides with Vue's template parser. The pipe-syntax (`'car | cars'`) for simple plurals is also a workaround for the same reason.

### What yapyak does

The Vue processor ships its own JS-aware mustache scanner that replaces Vue's tokenizer. It tracks:

- Single- and double-quoted strings (with backslash escapes)
- Template literals with nested `${...}` (recursively)
- Block and line comments
- Brace depth for objects and call arguments

The first `}}` outside any of those contexts is the real end of the mustache.

```vue
<template>
  <p>{{ $t('You have {count, plural, one {# msg} other {# msgs}}', { count }) }}</p>
  <p>{{ $t('{theme, select, dark {Dark mode} other {Light mode}}', { theme }) }}</p>
  <p>{{ $t('You have {count, plural, one {# by {author}} other {# by {author}}}', { count, author }) }}</p>
</template>
```

No lifting. No `<i18n-t>` component. No `v-text` attribute. No documentation footnote.

For transformed output, catalog string literals encode `{` and `}` as the Unicode escapes `\u007b` and `\u007d` so Vue's downstream compiler — which has the same parser limitation — never sees raw braces inside strings. JS evaluates the escapes back to `{` and `}` at runtime, so values are byte-identical to the unescaped form.

### Reviewer talking points

- "Vue's mustache parser is JS-naive. Every other i18n library makes users work around it. yapyak fixes it."
- "yapyak is the only i18n library where ICU plurals and selects work directly in Vue templates without lifting expressions or wrapping in components."

### Tests that lock this in

`packages/compiler/src/parser/processor/vue.test.ts`:
- Extracts ICU plural / select / nested ICU in `{{ }}`
- Handles double-quoted strings with `}}` inside
- Handles template literals with `${...}` interpolations
- Handles escaped quotes, block comments, multiple interpolations on the same line

`packages/compiler/src/parser/transform.test.ts`:
- Escapes `{` and `}` in catalog strings so downstream parsers never see literal braces

---

## The source string IS the catalog key

### The problem

Every other i18n library inserts a layer of indirection between the developer's intent and the translation:

| Library | Catalog key |
|---|---|
| **react-i18next** | Explicit ID — `t('greeting.hello')` looks up `greeting.hello` in JSON |
| **FormatJS** | Explicit `id` field, source string is `defaultMessage` |
| **Lingui** | Hash-based ID — `MbT6FE` generated from source, stored in catalog |
| **Paraglide** | Required message ID (`greeting`) in messages/en.json |
| **vue-i18n** | Dot-notation keys |
| **next-intl** | Namespace + key |

The hash-ID approach (Lingui) is the closest to "source is key" but the on-disk catalog still uses opaque hashes. Translators reading a `messages.po` see `msgid "MbT6FE"`, not the actual English string.

### What yapyak does

The English source string is the catalog key on disk. Translators see exactly what the developer wrote:

```json
{
  "src/components/header.tsx": {
    "Save changes": "Spara ändringar",
    "You have {count, plural, one {# message} other {# messages}}": "Du har {count, plural, one {# meddelande} other {# meddelanden}}"
  }
}
```

`$t('Save changes')` in code maps directly to `"Save changes"` in the locale file. No hash to look up. No namespace to remember. No collision between two files that have a `save` key — keys are scoped by file path (see "Per-file scoping" below).

The runtime catalog uses a 12-character SHA-256 hash for compactness, but the dev-facing artifact — the file translators edit — never exposes that hash.

### Why this is hard to copy

It requires:

1. A static analysis pass that reads the literal at the call site (no `t(variable)`)
2. File-path-scoped catalogs (otherwise identical strings in two files collide)
3. Position-aware rename detection (so typo fixes don't strand translations — see below)
4. A separate runtime ID derivation that's invisible to the developer

Most libraries chose the IDs-first design and can't retrofit source-as-key without breaking their catalog format.

### Reviewer talking points

- "Translators see the English. Developers write the English. The build figures out the rest."
- "No `i18n.t('greeting.hello.morning')`. Just `$t('Good morning')`."

---

## AI translation runs on save, in your dev loop, with your provider key

### The problem

Other libraries treat AI translation as a separate workflow — a CLI step, a CI job, or a paid SaaS:

| Library/Tool | When AI runs | Where the key lives |
|---|---|---|
| **i18n-ai-translate** | CLI run | Local |
| **@awsless/i18n** | Vite build (not dev) | Local |
| **Tolgee AI** | Tolgee's servers | Tolgee's platform |
| **Locize** | Locize's servers | Locize's platform |
| **Crowdin / Lokalise** | Their platforms | Their platforms |
| **Lingui** | Proposed (RFC #2392), not shipped | — |
| **i18next, react-intl, vue-i18n, next-intl, Paraglide** | Not built in | — |

Build-time CLI translation breaks the feedback loop: save → run `npx translate` → reload. SaaS-based AI translation means routing your strings through someone else's infrastructure and paying their margin on top of token costs.

### What yapyak does

The Vite plugin watches saves. On every save:

1. Extracts `$t()` calls from the file
2. Computes the diff against the previous extraction
3. Updates locale files (adds new keys, removes orphaned ones, migrates renamed ones)
4. Calls the configured AI translator with the missing strings — asynchronously, with your API key, directly to the provider

By the time you alt-tab to the browser, every locale's translation is filled in. HMR fires, the page updates.

The key never leaves your machine. There is no yapyak server. The translator is a function that takes a batch of strings and returns a batch of translations — what provider you use is your business.

### Multi-provider out of the box

Anthropic, OpenAI, Gemini, Ollama all ship as first-class peer packages. Each is ~150 LOC of provider-specific request shape:

```ts
import { yapyak } from '@yapyak/vite';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  plugins: [
    yapyak({
      translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
    }),
  ],
});
```

The CLI (`npx yapyak add sv`) auto-picks a provider based on which env var is set (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`). No separate config file required.

### Reviewer talking points

- "Save the file. Every locale already updated. With your key, not ours."
- "No SaaS in the loop. No CI step. No `npx translate` after every change."

---

## ICU placeholder types inferred from the inline string literal — at the call site

### The problem

Type safety for i18n is famously hard:

| Library | Compile-time type safety for placeholders |
|---|---|
| **react-intl / FormatJS** | None. Open issue [#3346](https://github.com/formatjs/formatjs/issues/3346) tracks this as unresolved |
| **react-i18next** | Type-safe keys via codegen; placeholder types only as `Record<string, unknown>` |
| **Paraglide** | Type-safe placeholders from compiled message functions — but only after codegen from JSON, not from inline literals |
| **typesafe-i18n** | Inline literal typing for simple placeholders only |
| **next-intl, Lingui, vue-i18n** | Codegen-based or loose `Record<string, unknown>` |

The closest analogs require either a separate codegen step or stop at simple placeholders.

### What yapyak does

Placeholder types are inferred from the source literal **at the call site**, with full ICU support — plural, select, selectordinal, number, date, time — at compile time via TypeScript template literal types. No codegen. No `.d.ts` file to keep in sync. No build step.

```ts
$t('Hi {name}', {});                // ❌ Property 'name' is missing
$t('Hi {name}', { name: 42 });      // ✅ name: string | number

$t('You have {count, plural, one {# msg} other {# msgs}}', {});           // ❌ count missing
$t('You have {count, plural, ...}', { count: 'three' });                  // ❌ count must be number

$t('Updated: {when, date, long}', { when: 'today' });    // ❌ when must be Date | number
$t('Updated: {when, date, long}', { when: new Date() }); // ✅

$t('{theme, select, dark {x} other {y}}', { theme: 42 }); // ❌ theme must be string
```

The type extraction recursively walks the source string at the type level. ICU format → value type mapping:

- `plural`, `selectordinal`, `number` → `number`
- `date`, `time` → `Date | number`
- `select` → `string`
- Simple `{name}` → `string | number`
- Unknown ICU format → `string | number | Date` (permissive fallback)

### Reviewer talking points

- "Type-safe placeholders without codegen. ICU plurals and selects included."
- "Forget a placeholder, you get a red squiggle. Wrong type, red squiggle. Inferred from the literal."

### Tests that lock this in

`packages/core/src/runtime/extract-params.test-d.ts` — type-level tests for every ICU format, including mixed ICU + simple, nested placeholders, and permissive fallback.

---

## Per-file scoping is the default — same string, different translations

### The problem

A "Save" button and a "Save" menu item rarely translate identically. In Swedish, the button might be "Spara" but the menu item "Spara som...". Most i18n libraries make you opt into context to express this:

| Library | How to differentiate identical strings |
|---|---|
| **i18next** | Explicit namespace per call: `t('save', { ns: 'admin' })` |
| **Lingui** | Explicit `context` parameter: `t({ message: 'Save', context: 'menu' })` |
| **FormatJS** | Custom `id` per call site, or `babel-plugin-react-intl-auto` (community) |
| **Paraglide, vue-i18n, svelte-i18n, next-intl** | Explicit namespacing |

The defaults punish the common case. Developers either remember to set context (and inevitably forget half the time) or accept that identical strings always translate identically (and accept the awkward translations).

### What yapyak does

Locale files are organized by **file path** as the primary key, source string as the secondary key:

```json
{
  "src/components/button.tsx": {
    "Save": "Spara"
  },
  "src/components/menu.tsx": {
    "Save": "Spara som..."
  }
}
```

`$t('Save')` in `button.tsx` is a different catalog entry than `$t('Save')` in `menu.tsx`. The compiler scopes automatically based on the source file. Translators see exactly which file each string lives in — useful context for choosing the right translation.

If you actually want the same translation in two files, you write the same string in both files and translate each entry the same way. Explicit > clever default deduping.

Moving code between files implicitly forks the entry — usually what you want when extracting components.

### Reviewer talking points

- "Same string, different file, different translation. Zero ceremony."
- "Translators see exactly which file each string is from."

---

## Position-aware rename detection — typo fixes keep their translation

### The problem

In a "source IS the key" system, fixing a typo or rewording naively loses the translation:

```ts
// Before
$t('Helo, {name}');  // sv.json: "Helo, {name}": "Hej, {name}"

// You fix the typo
$t('Hello, {name}'); // sv.json: { "Hello, {name}": "" }  ← gone!
```

Other "source-as-key" approaches (mostly Lingui via hash ID) sidestep this because the ID is hash-based — but they trade away the readability of source-as-key in the on-disk catalog. Libraries with explicit IDs don't have this problem at all (the ID is stable; you edit the value).

### What yapyak does

When yapyak's Vite plugin re-extracts a file, it compares the previous snapshot with the new one. If a `$t()` call at the same `line:column` position has a changed source string, it's treated as a rename:

```ts
// Saved file:
$t('Hello, {name}')  // line 14:8

// Previous snapshot for line 14:8: source was 'Helo, {name}'
// → detected as rename, not deletion
// → migrate "Helo, {name}": "Hej, {name}" → "Hello, {name}": "Hej, {name}"
```

The locale file ends up with the correct key and the existing translation preserved. No human intervention.

Toggleable per project (`preserveTranslationsOnRename` option). Defaults to true unless an AI translator is configured — when AI is available, re-translation is cheap and re-deriving from the corrected source produces better quality.

### Why nobody else does this

It requires:

1. Per-save position tracking of every call site
2. A heuristic for "same call, changed source" vs "two different calls"
3. A catalog migration step that runs as part of the dev loop, not as a one-shot CLI

The "source IS the key" + "edit-in-place dev experience" combination is what makes this necessary. Libraries with explicit IDs don't need it; libraries with hash IDs avoid it by not encoding the source in the ID.

---

## AI translator gets per-call-site context for tone-correct output

### The problem

"Save" as a button label, "Save" as a save-the-whale-page heading, "Save" as a chess move annotation — same English string, three different translations in most languages. AI translators given just the string in isolation produce generic, often wrong, translations.

Tolgee and Locize ship AI translation but rely on platform metadata. CLI tools like `i18n-ai-translate` pass strings in batches with no context. Most i18n libraries don't ship AI at all.

### What yapyak does

For each `$t()` call, the compiler walks the AST upward and records:

- The nearest enclosing JSX/HTML/template tag (`button`, `h1`, `label`, `aria-label="..."` attribute)
- The enclosing function name (`SaveButton`)
- The enclosing hook name (matches `useFoo` pattern)
- The component name — with HOC unwrapping for `forwardRef`, `memo`, `lazy`, `observer`

This metadata is bundled into the AI translation request along with the source string:

```
Translate to Swedish:
"Save"
Context:
- Component: SubmitForm
- Element: button
- File: src/components/forms/submit-form.tsx
```

The AI picks "Spara" (imperative button) instead of "Räddning" (the noun for "rescue").

A `ContextLevel` setting (`'none' | 'minimal' | 'rich'`) controls how much context is sent — privacy/quality trade-off.

### Why others don't do this

It requires:

1. AST analysis with framework-aware traversal (JSX, Vue template, Astro frontmatter, Svelte block)
2. HOC unwrapping logic (the component name isn't obvious in `const X = memo(() => ...)`)
3. A privacy knob — sending source code context to a remote AI is a real concern for many teams
4. A translator contract that accepts structured context, not just `string[]`

It's a lot of plumbing for a feature most libraries don't even have AI translation to plug into.

### Reviewer talking points

- "Your AI translator knows the string is a button label. Not just the English."
- "HOC-wrapped components? We unwrap `memo`/`forwardRef`/`lazy` to find the real name."

---

## Framework-agnostic reactivity — one `$t`, reactive everywhere

### The problem

Every framework has its own subscribe-to-changes primitive:

- React: `useSyncExternalStore` / context
- Vue: `customRef` / reactive refs
- Svelte 5: `$state` / runes

A "universal" i18n function that's reactive in all of them usually requires either a per-framework wrapper (i18next's `<Trans>` family, Lingui's `<Trans>`) or a framework-specific hook (next-intl's `useTranslations`).

Paraglide's compiled-function approach sidesteps reactivity entirely — its functions are pure, locale-switching reloads the page (or relies on the consumer's framework to trigger a re-render via prop drilling).

### What yapyak does

A single global `$t` is reactive in every framework because of a side-channel: `runTrackers()`. Every `$t()` call (and every compiled `_$pick()` call) invokes registered tracker callbacks before returning. Each framework adapter registers a tracker that touches its native reactive primitive:

```ts
// packages/vue/src/locale.ts
registerTracker(() => { void locale.value });        // Vue customRef read

// packages/svelte/src/locale.svelte.ts
registerTracker(() => { void active });               // Svelte $state read

// packages/react/src/locale-provider.tsx
//   useSyncExternalStore + key-remount on locale change
```

The act of calling `$t()` inside a component implicitly subscribes the component to locale changes. No `useT()` hook. No `<Trans>`. No Vue plugin install. Just `import { $t }` and call it.

### Why nobody else has done this

Most i18n libraries' API design predates `useSyncExternalStore` and framework signal stories. They picked a per-framework wrapper years ago and can't break compat now. yapyak being newer started from "the call itself signals a dependency" as the primitive.

### Reviewer talking points

- "Same `$t` in React, Vue, Svelte. No hook, no provider, no component wrapper. Calling it makes the component reactive."

---

## Pluggable `Processor` interface — add a framework in a few hundred lines

### The problem

Adding a new framework to an existing i18n library is a fork-and-PR exercise. There's no documented extension point that says "implement this interface, plug it in, done."

i18next has plugins — but for backends, language detectors, post-processors. Not "add Astro support." Paraglide has plugins for catalog formats — but not for framework integrations. Lingui has Babel/SWC plugins as the only extension surface; adding Vue support means deep tooling work.

### What yapyak does

A `Processor` is a documented public interface:

```ts
export interface Processor {
  parseFragments(source: string): Fragment[];
  applyImport(magicString: MagicString, source: string, importStatement: string): void;
}
```

Implementing the interface adds a framework. A `Fragment` is `{ code, kind: 'script' | 'template-expression', lang, originalOffset }`. The compiler handles cross-fragment binding resolution, extraction, transformation, and source maps — your processor only translates the framework's AST into fragments.

The shipped processors (Vue ~280 LOC including the JS-aware mustache scanner, Svelte ~270 LOC, Astro ~205 LOC, Vanilla ~30 LOC) are the entire framework integration. Lazy-loaded via optional peer deps so a React-only app pulls zero framework compilers.

### Why nobody markets this

Most libraries don't because they don't need to — they support the popular frameworks themselves. yapyak markets this because:

1. Lit, Solid, Qwik, Marko, custom in-house template engines exist and have users
2. The interface is small enough to actually implement
3. A framework integration owned by the framework community (not yapyak) is healthier long-term than yapyak being the bottleneck for every framework

### Reviewer talking points

- "Your framework not on the list? Implement two functions. Open a PR."

---

## No global runtime catalog — every call site ships its own slice

### The problem

The standard i18n library architecture is: load a catalog of all messages at startup, look up keys at runtime against that catalog. `i18next.init({ resources: {...} })`. `<IntlProvider messages={...}>`. This means:

- Cold start has to load the catalog
- Unused messages stay in the bundle (no per-message tree-shaking)
- Code-splitting i18n is a manual exercise (load namespace per route)

Paraglide solved this with compiled per-message functions. yapyak goes a step further.

### What yapyak does

The compiler rewrites every `$t()` call to inline its own per-locale catalog:

```ts
// You write
$t('Save changes')

// Compiler emits
_$pick({ en: "Save changes", sv: "Spara ändringar" })
```

There's no global catalog. There's no `loadCatalog()` call. There's no namespace splitting. Each call site carries exactly the strings it needs, in every locale you compile for.

`_$pick` is a 25-line helper that picks the active-locale string, interpolates if needed, and falls back to `defaultLocale`:

```ts
export function _$pick(
  variants: Record<string, string>,
  params?: Record<string, unknown>,
  options?: { locale?: string },
): string {
  const active = options?.locale ?? getLocale();
  const text = variants[active] ?? variants[defaultLocale] ?? '';
  return params === undefined ? text : interpolate(text, params, active);
}
```

Tree-shaking works at the call-site granularity. Code-splitting works because each chunk only carries the strings that chunk's code uses. Route-based locale loading is automatic — no namespace boilerplate.

In single-locale mode, even `_$pick` disappears: `$t('Hello')` compiles to the literal `"Hello"`, and the entire `@yapyak/core` runtime gets tree-shaken away if no other features are used.

### Reviewer talking points

- "No catalog to load. No namespaces to manage. Code-splitting is automatic."
- "Single-locale mode? `$t('Hello')` is literally `\"Hello\"` in your build."

---

## Single config source — CLI shares Vite plugin config automatically

### The problem

Most i18n setups duplicate configuration: a Vite/webpack plugin config plus a separate `i18n.config.ts` or `.lokaliserc` for the CLI extraction tool. Keeping them in sync is on you. Forget to update one when you add a locale, and your CLI silently writes to the wrong directory or skips a language.

### What yapyak does

The CLI reads the user's `vite.config.ts` via Vite's `loadConfigFromFile`, finds the `yapyak` plugin in the resolved plugin tree (descending into nested arrays and promises), and reads its `plugin.api.yapyak` object:

```ts
// packages/vite/src/plugin.ts
return {
  api: {
    yapyak: {
      defaultLocale: normalized.defaultLocale,
      localesDir: normalized.localesDir,
    },
  },
  ...
};
```

`localesDir`, `defaultLocale`, and discovered locales only need to be configured in one place — your `vite.config.ts`. Adding `npx yapyak add ja` or `npx yapyak translate` requires no extra config file. The CLI imports your Vite config and reads from there.

### Reviewer talking points

- "One config. Vite plugin and CLI both read it. No `.i18nrc` to keep in sync."

---

## What we deliberately don't claim

These are 2026 table stakes. We do them well, but claiming them as differentiators is dishonest:

- **URL-based locale persistence** — next-intl, Paraglide, Astro, and others all have this.
- **JSON catalogs** — Everyone except Lingui (which defaults to PO).
- **Optional peer dependencies / per-framework split packages** — Standard practice.
- **Single-locale tree-shaking** — Paraglide's `experimentalStaticLocale` is comparable. We're more aggressive (literal-string elision in the call site) but it's not unique.
- **Same `$t` API across frameworks** — Paraglide also markets this with compiled functions. We do it with reactivity *and* rich ICU support, but the bare headline isn't ours alone.

Lead with what's actually rare or unique. Acknowledge what's not. Readers who know the space will trust the rest of the doc more.
