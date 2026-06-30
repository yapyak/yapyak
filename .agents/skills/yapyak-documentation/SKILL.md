---
name: yapyak-documentation
description: "Guide authoring: voice, what-to-cut, structure, code blocks, framework switching, page templates, tone budget. Use when writing or editing guide/docs content."
---

User-facing guide at `docs/content/guide/*.md`. JSDoc → [[yapyak-jsdoc]], README → [[yapyak-package]], vocabulary → [[yapyak-terminology]].

### Voice

The guide is technical documentation, not a pitch. Every sentence must answer one of:

1. What does the API do?
2. How does it behave?
3. What problem does it solve?
4. What's the tradeoff?

If a sentence doesn't answer one of those, cut it. Never try to repair it.

Start each page with what the thing is, followed by a code example. Show what the developer writes, what yapyak produces or compiles, and what problem it solves. Explain only what is needed.

Reference: Stripe API docs and the Postgres manual. Not startup landing pages.

### What to cut

Specific patterns that signal AI-generated marketing prose. Cut on sight:

- **Rule-of-three negation.** "Not X, not Y, not Z." Even when a positive frame is available.
- **Personification.** "The compiler knows / decides / handles." Tools don't know. State the mechanism.
- **"Lives in" / "sits at".** "The full type lives in X." Just say where it is.
- **Em-dash example lists.** "Locales — English, Swedish, French — all do X." Cut the list or use a real list.
- **Hedge words.** `just`, `simply`, `actually`, `really`, `basically`, `essentially`.
- **Restate after code.** "As you can see above..." Code speaks. Never translate it back to prose.
- **Closers.** "The principle:" / "What this gives you is..." / "In other words..."
- **Openers.** "This page covers..." / "Let's explore..." / "In this section we'll..."
- **Reassurance.** "Don't worry, X is easy." "There's no need to..."
- **Comparisons as framing.** "Unlike X, yapyak..." Compare on demand, never as a section opener.
- **Marketing adjectives.** `powerful`, `seamless`, `intuitive`, `magic`, `effortless`, `just works`, `out of the box`.
- **Autocomplete reassurance.** "Your editor will autocomplete every option." TS users know.
- **"See also"-style trailing sections.** No `## See also`, no `## Where to go next`, no `## Further reading`.

### Before / after

The same idea, AI prose vs target voice:

> AI prose: yapyak's powerful save loop seamlessly translates your messages, ensuring you never have to worry about a missing translation again. The compiler knows what changed, what's new, and what needs to be retranslated — all without you lifting a finger.

> Target: On save, yapyak extracts new messages and writes them to your locale files. Without a translator, the value is an empty string.

Same information, no personification, no marketing, no reassurance.

### Vocabulary

Locked terms — canonical word + banned synonyms — live in [[yapyak-terminology]]. Use them; never coin a synonym in prose.

### Output blocks

Show a computed result with a `// output:` comment inside the code block. The compiler extracts it and renders it as distinct output chrome — there is no `{% output %}` tag.

```ts
t('{count, plural, one {# message} other {# messages}}', { count: 5 });
// output: 'You have 5 messages'
```

For per-locale results, put one `// <locale>: '…'` line under a bare `// output:`:

```ts
format.number(1000);
// output:
// en: '1,000'
// sv: '1 000'
```

#### Locale codes in output examples

Use the short form (`en`, `sv`, `fr`, `de`, `ja`, `ar`, …), not the regional form (`en-US`, `sv-SE`). Locale variance in formatting examples doesn't depend on region — the short code is the right level of detail and keeps the docs consistent. The regional form is appropriate only when the example specifically demonstrates a regional difference (e.g. `en-US` vs `en-GB` date formats), which is rare.

### Headings

Short, factual nouns. Examples: `Messages`, `Context`, `ICU`, `Rich text`, `Bundles`, `Files`, `SSR`, `Save loop`, `Refactors`.

Not `How yapyak handles X`, `Working with Y`, `Getting started with Z`, `Best practices for W`.

One thesis per section. If a section has two, split it.

### Code blocks

- Filename labels go in the bracket fence: ` ```ts [vite.config.ts]`. Never use `// filename` comments inside the block.
- Single-property objects collapse to one line: `glossary: { cart: { sv: 'kundvagn' } }`. Multi-property objects spread one property per line.
- Sort object properties alphabetically. Exception: config files (`yapyak.config.ts`, `vite.config.ts`) keep author-intended order.
- ICU strings inside `t()` literals are not object literals — never edit or sort the content of `{count, plural, ...}`.
- JSX attribute expressions `attr={expr}` are not object literals — leave them as-is.
- Locale-file JSON is always path-nested AND fully expanded — the inner `{ "key": "value" }` object always sits on its own lines, never on the same line as the path key:

  ```json
  {
    "src/components/empty-cart.tsx": {
      "Your cart is empty": "Din kundvagn är tom"
    }
  }
  ```

  Never collapse to `{ "src/...": { "Key": "Value" } }`. Never flatten the path away. The single-property-collapse rule does NOT apply to locale files — every translation key gets its own line under its source-path key.
- Use `ts` for API demonstrations. Use the framework-specific language (`tsx`/`vue`/`svelte`/`astro`) iff the snippet renders as a component.
- **Blank line between every top-level statement.** `const options = ...;` followed by `t('Choose one of {options}.', { options });` always has a blank line between them. Same for parallel declarations (`const claude = ...;` / `const gpt = ...;`). Same for repeated demo calls (`t('Save'); t('Save');`). The only exemption is consecutive `import`/`export` lines, which follow standard JS convention and stack without blanks.

### Comments inside code blocks

Code blocks contain code, not prose. The default is no comments. The narrow exceptions:

- **Type-check pass/fail markers.** `// ✓` and `// ✗` next to lines that demonstrate type-system behavior.
- **Diagnostic-utfall.** `// error: missing 'name'`, `// no other context for 'Open' anywhere`, `// narrowed to Currency`. What the compiler or editor *says* about the line, not what the author thinks about it.
- **Genuine code comments** that would appear in real production code (rare in docs examples).

Everything else moves out. Specifically:

- **Editorial labels** like `// English source: just one and other` or `// Swedish keeps the order` — these are prose. They live as a one-line lead-in before the code block, or as a sentence in the surrounding paragraph.
- **Filename markers** like `// sv.json — link wraps a different word` — use the bracket-fence label: ` ```json [locales/sv.json] `. The annotation moves to the lead-in sentence.
- **Compile-output annotations** like `// becomes: 'Spara ändringar'` or `// catalog entry: _date(...)` — split into a second code block with `compiles to:` (or similar) prose between, or describe the result in a sentence after the input block.
- **Variant labels** like `// Groq`, `// or with options:` — split into separate code blocks with a lead-in for each.
- **Result outputs** like `// 'apple, pear, and orange'` or `// ['zh-Hant-TW', 'zh-Hant', 'zh']` — use a `// output:` marker (see "Output blocks" above).
- **Placeholder ellipses** like `// ...your root layout here...` — delete every `// ...placeholder...` comment. If the omitted code is load-bearing, replace it with real code; otherwise restructure so it never appears. A code block contains only runnable lines.

The principle: a comment in a code block must describe behavior of the code itself (what the type checker or runtime would say). If the comment is describing *the example* or *the docs reader's situation*, it's prose and belongs outside.

### Framework switching

Examples that show framework-specific code (component shapes, not the API itself) use the Markdoc switch:

```
{% switch group="framework" %}
{% when value="react" %}
{% /when %}
{% when value="vue" %}
{% /when %}
{% when value="svelte" %}
{% /when %}
{% when value="astro" %}
{% /when %}
{% /switch %}
```

API-only examples that demonstrate `t()` or `format.*` stay as plain `ts` — no switch needed. Adding a switch where the code is identical across frameworks is boilerplate that bloats the page.

The four switch groups the compiler recognizes are `framework` (`react`/`vue`/`svelte`/`astro`), `adapter`, `translator`, and `packageManager`. Use `{% when value="…" %}` branches inside the switch, the same shape as the framework example above.

For a single forced branch with no alternatives, use `{% only group="…" value="…" %}`; for an inline option selector, `{% picker group="…" %}`.

### Package-manager switching

CLI invocations switch on `group="packageManager"` with `value="pnpm"|"npm"|"bun"`. Never hand-write the package-manager switch around install commands — the compiler wraps `pnpm add …` automatically. Write it manually only for non-install CLI invocations (`pnpm yapyak add sv`).

### `{% diagnostics %}` for type-check examples

When showing the type-checker's pass/fail behavior on multiple lines, use the `{% diagnostics %}` Markdoc tag instead of plain code blocks with `// ok` / `// error: ...` comments. The tag's renderer extracts the trailing comment from each line and renders a status indicator (✓/✗) plus the diagnostic message as proper UI chrome — the code stays clean, the diagnostic is visually scannable.

Syntax inside the tag:

```
{% diagnostics %}
t('Hi {name}', { name: 'Ada' });             // ok
t('Hi {name}', {});                          // error: missing 'name'
t('Hi {name}', { user: 'Ada' });             // error: 'user' is not assignable
t(`Hi ${name}`);                             // no
t('Hi {name}', { name });                    // yes
{% /diagnostics %}
```

Accepted annotations after the `//`:

- `ok` or `yes` → renders as ✓ (no message)
- `no` or `error` → renders as ✗ (no message)
- `ok: <message>` or `ok <message>` → ✓ with message
- `error: <message>` or `error <message>` → ✗ with message
- Any other free text → ✗ with the text as the message

Use plain code blocks (no `{% diagnostics %}`) when there's no pass/fail story — just demonstrating an API call. Use `{% diagnostics %}` only when the *contrast* between ok and error lines is the point.

Inside `{% diagnostics %}`, each line is one diagnostic case. The multi-property-per-line rule is suspended for these blocks — inline `{ currency: 'EUR', style: 'currency' }` is correct since the format requires one entry per line and the focus is on the diagnostic pattern, not the object's shape details.

### Never document `Intl`

`format.*` is a thin wrapper over `Intl`. The guide explains what yapyak adds — type safety, locale resolution, graceful fallback. For option enums (`currencyDisplay`, `numberingSystem`, `style`, `type`, etc.) link to MDN. Never enumerate `Intl` values inline.

For a related pattern: if the only thing a section says is "here are the values this option accepts", that section is `Intl` documentation. Cut it.

### Inline option enums

Never write inline-comment enumerations (`// 'none' | 'cookie' | …`). For yapyak's own surface use a Field/Default/Description table; for `Intl` options link to MDN.

```ts
persistence: 'none',   // 'none' | 'cookie' | 'url' | 'local-storage'
```

The inline-comment-as-documentation pattern collapses signal and is hard to scan.

### When refining text

Rebuild freely. Cut every repetition. Cut every preaching sentence. If a paragraph survives the 4-question test only after heavy patching, replace it; never repair it.

Two specific failure modes to watch for:

- **Repeated information across sections.** If "every field is optional" appears in the intro and again in the quick reference, one of them is dead weight.
- **Missing concrete location.** If the page describes a file (`yapyak.config.ts`, `locales/en.json`), state where it lives — at the project root, in `localesDir`, etc.

### Public surface only

Only document symbols exported from the public package entry (e.g. `yapyak`, `@yapyak/react`, `@yapyak/vite`). Symbols exported from `/internal` subpaths are implementation detail for the compiler's emitted code — never reach for them in the guide. If a feature seems documentable but only exists via an internal export, that's a sign it isn't a feature yet.

### App conventions

- **i18n: use `yapyak`'s `t` directly — no wrapper hook.**
  - `import { t } from 'yapyak'`; all user-facing strings go through `t('...')`.
  - Locale switching uses `useLocale()` from `yapyak/react`.
  - The source string IS the key. No `{subject}{Component}{Prop}` key conventions.
- **Design tokens live in `src/style.css`** as CSS custom properties (`--bg`, `--text`, `--mint`, `--space-*`, `--radius-*`, etc.). CSS Modules conventions otherwise per [[yapyak-css]].
- **No backend.** Types come from `yapyak`'s public exports and each route's own data shape.
- **No backend mutations.** If a route needs an action (rare), use a server function or plain `fetch` directly.
- **Loaders return Markdown content** for `/guide/$slug` routes. The shape is `{ title, description, content }` parsed from frontmatter — pass through to the component unchanged. **Never set `description` in page frontmatter:** the renderer turns it into a `<p>` directly under the `<h1>`, which becomes a second lede paragraph competing with the body's opening line. Only `title` and `order` belong in frontmatter for guide pages.
- **Path aliases** `#components/*` and `#lib/*` are wired via package.json `imports` and tsconfig `paths`. Use them for cross-folder imports, not relative paths.

### The yapyak ethos

The thesis that underlies every page, every feature, every line of copy:

> **Translation is part of the local dev loop — not a project beside it.**
> You write code. yapyak handles i18n. Locally. Without a portal.

Everything else follows from that.

#### The five underlying beliefs

1. **Local beats portal.** Locale files live in the repo, get committed via git. No dashboard, no seat-model, no "Contact sales".

2. **The source string is the contract.** The English you write IS the key. No `t('common.buttons.save_v2')`. No `.d.ts` to maintain. What Tailwind did for class names, yapyak did for i18n keys.

3. **AI is useful — when it has context.** Not magic. Not perfect. But useful when it knows you're writing inside a `<button>` in `<SaveDialog>`, with voice "casual" and glossary `"Cart" → "Korg"`. And always optional. Skip AI entirely if you want.

4. **No margin on your tokens.** You bring your own API key. Anthropic, OpenAI, Gemini, Ollama, or a custom translator in 30 lines. yapyak never sees your tokens.

5. **Behind all the AI talk, yapyak is a normal modern i18n library.** Plurals, dates, lists, ordinals, framework adapters, CLI, manual workflow, rename-detection. The boring stuff works.

#### Lift the non-business-model angle early

In any long-form doc, README, or release post, the *"yapyak has no business model"* and *"bring your own AI"* points should appear early — typically in the first one or two paragraphs after the thesis. This is not a footer disclaimer or fine-print beat. It's a core promise that shapes how the reader frames everything else.

Phrasings that work:

- *"Your AI key. Your locale files. yapyak has no business model."*
- *"yapyak never sees your tokens."*
- *"A library on npm. MIT-licensed. No portal."*

---

### yapyak-specific docs conventions

The generic voice and structure rules live in [[yapyak-documentation]]. What follows is yapyak-flavored: brand conventions, canonical examples, terminology, page templates, the tone budget.

#### Brand conventions

- **`yapyak`** — always lowercase in prose, even at sentence start. Like `npm`, `iPhone`, `eBay`.
- **`t()`** — code-formatted (backticks) when referring to the function.
- **HTTP headers** — canonical casing in prose: `Accept-Language`, `Cookie`, `Authorization`. Not `accept-language`, even though the wire format is case-insensitive.
- **TypeScript identifiers** keep their casing as defined: `YapyakOptions`, `TIn`, `AnthropicOptions`. These follow code conventions, not brand conventions.

#### Subject is yapyak or the reader — never "we" or "I"

Reinforces the generic active-voice rule with yapyak-specific examples.

| Tempted to write | Write instead |
|---|---|
| *We extract strings on save.* | *yapyak extracts strings on save.* |
| *We pass call-site context to the AI.* | *yapyak passes call-site context to the AI.* |
| *I built this because…* | *yapyak treats translation as part of the local dev loop.* |
| *We don't take a margin on AI.* | *yapyak never sees your tokens.* |
| *Let's add a translator.* | *Add a translator like this:* |

(Exception: changelog entries, blog/release posts, and `README.md` may use "I" / "we" since they're authored statements. Docs are not.)

#### Voice signature — calibration anchors

Lines that pass the yapyak bar: technically true, specific, quietly funny. The level we aim for:

- *"Forget a `{count}` placeholder and TypeScript stops you before your tech lead does."*
- *"Yes, all four Polish plural forms."*
- *"Set a voice ('friendly', 'terse', 'lawyer at a dinner party')."*
- *"Even when the AI thinks it knows better."*
- *"Next.js? Open a PR."*
- *"No 'Contact sales'. Other i18n services mark up your AI bill 5x. yapyak never sees your tokens."*

Each line above is *technically true*, *specific*, and *quietly funny*. None of them are punchlines.

Below the line — never write:

- ✗ *"AI go brrr 🚀"*
- ✗ *"Translation: solved!! 🎉"*
- ✗ *"Buckle up, this is gonna blow your mind."*
- ✗ *"yapyak go brr"* / *"Just sprinkle some t() on it"* / wink-wink meme references.

The difference: feature-list-level humor *informs* while it amuses. Meme-level humor *only* amuses, and breaks tone.

#### yapyak-flavored banned phrasings (in addition to the generic banned vocabulary)

Tautological closers and yapyak-shaped cute-speak:

- *"X just lets Y come along for the ride."* — passive-cute. Rewrite as active.
- *"Adding a Z is one Z, not a pipeline."* — over-clever inversion.
- *"yapyak just lets translations come along for the ride."*

#### Lead with code blocks, not inline code

The example is the explanation — but it should be a small *code block*, not endless backticks scattered in prose. Inline `code` is for naming a specific identifier, not for showing usage.

- ✓ Write a short code block showing `t('Save changes')` in context. Body prose stays clean.
- ✗ *"Call `t()` with a `source` string and optional `params` for `{placeholder}` interpolation against the `Intl` primitives configured in `yapyak.config.ts`."* — every other word is in backticks. Show, don't sprinkle.

A sentence with 3 or more inline `code` spans must become a code block.

#### Canonical examples

One canonical set used everywhere. Never invent throwaway examples.

- **Canonical example string**: `t('Save changes')`. Use `t('Hello, {name}!')` only when illustrating interpolation specifically.
- **Canonical filename**: `save-button.tsx`.
- **Canonical component name**: `SaveButton`.
- **Canonical locale pair**: `en` (source) → `sv` (translated). Use `es`/`fr`/`de`/`ja` only when illustrating *multiple* locales.

#### Examples never show explicit return types

Guide code examples target what a *reader would write*, not what the library's `isolatedDeclarations` setting enforces internally. Inference is the everyday TypeScript flow. Never import `ReactElement` / `JSX.Element` just to annotate the return.

```tsx
// ✓ Inferred return
function Component() {
  // ...
}

// ✗ Annotated return
import type { ReactElement } from 'react';
function Component(): ReactElement {
  // ...
}
```

Same rule for arrow functions. The point of the example is the surrounding logic, not annotation discipline. (yapyak's own library code follows `isolatedDeclarations`, but that's an internal-correctness concern, not an example-pedagogy concern.)

#### Component code: when to show all frameworks

The mechanics of framework/package-manager switching (the `{% switch %}` / `{% when %}` / `{% only %}` / `{% picker %}` tags, group names, output blocks) are defined once in [[yapyak-documentation]] — that is the source of truth. There is no `{% code-group %}` tag; framework variants use `{% switch group="framework" %}`. What follows is only the yapyak-specific editorial rule for *when* to show one framework vs all of them.

Two kinds of component examples appear in the guide. Treat them differently.

**Framework-specific API — use `{% switch group="framework" %}` with all three frameworks.**

When the *call shape itself* differs per framework — `<RichText>` with render-prop in React, slot in Vue, snippet in Svelte; or framework-specific hooks/composables/runes like `useLocale()` — the reader cannot read another framework's syntax and apply it. Show all three.

**Framework-agnostic API — use a single React example.**

When the call shape is identical JS that happens to sit inside a component (`t()`, `t.as()`, `t.in()`, `format.number()`, `parseRichText()`), the framework is just wrapping context for the call. The example body is the bare API call plus standard JS — no framework hook, rune, slot, or lifecycle — so a Vue or Svelte reader applies it directly. Repeating the same example three times dilutes the lesson and falsely signals "this is framework-specific."

Default to React for the single example. Never add an 'identical in Vue/Svelte' note — the framework-agnostic-API rule already implies it.

**Order in the switch.**

The order is always **React, Vue, Svelte** — one `{% when value="…" %}` branch each, with plain `tsx` / `vue` / `svelte` code fences. Never add `[React]` / `[Vue]` / `[Svelte]` tab labels; the switch renders the labels.

````markdown
{% switch group="framework" %}

{% when value="react" %}
```tsx
import { RichText } from '@yapyak/react';
import { t } from 'yapyak';

export function Notice() {
  return (
    <RichText
      value={t('Read the <link>docs</link>.')}
      link={(children) => <a href="/docs">{children}</a>}
    />
  );
}
```
{% /when %}

{% when value="vue" %}
```vue
<script setup lang="ts">
import { RichText } from '@yapyak/vue';
import { t } from 'yapyak';
</script>

<template>
  <RichText :value="t('Read the <link>docs</link>.')">
    <template #link="{ children }">
      <a href="/docs">{{ children }}</a>
    </template>
  </RichText>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte
<script lang="ts">
  import { RichText } from '@yapyak/svelte';
  import { t } from 'yapyak';
</script>

<RichText value={t('Read the <link>docs</link>.')}>
  {#snippet link(children)}
    <a href="/docs">{children}</a>
  {/snippet}
</RichText>
```
{% /when %}

{% /switch %}
````

**When NOT to use the framework switch at all:**

- Plain TypeScript with no framework UI (`import { t } from 'yapyak'; const text = t('Save changes');`)
- CLI commands (`npx yapyak add sv`)
- Configuration files (`vite.config.ts`, `yapyak.config.ts`)
- JSON examples (`locales/sv.json`)
- Adapter-specific setup that only applies to one framework (covered on the adapter's own page)

**Astro is never in the framework switch for API examples.** yapyak has no Astro component bindings — only the SSR adapter. Astro users call the same JS APIs and read whichever single-framework example we show. Cover Astro on its adapter page where it actually matters.

The trigger is **call-shape divergence** (§ above): show all three when a framework hook, rune, slot, or render-prop appears in the body, or the import path differs across React/Vue/Svelte. Rendering as a component is a sufficient sign of divergence, not a necessary one — a value-returning hook like `useLocale()` still diverges.

#### Page-type templates

yapyak's three canonical page skeletons. Mirror them exactly. Pick by the page: a per-section `index.md` → Concept introduction; a page documenting one provider / adapter / implementation → Detail; any other page → Topic.

**Concept introduction page** (the per-section `index.md`, e.g. `guide/translating/index.md`, `guide/formatting/index.md`, `guide/switching/index.md`):

```
---
title: Introduction
order: 1
---

<one-sentence definition of the topic — what it IS, abstract>

## What an X does

<mechanics — how it works in one paragraph>

## When you don't need one (optional)

<edge cases where the topic doesn't apply>

## Pick your Y

<linked list of detail pages>
```

**Detail page** (any provider/adapter/specific implementation):

```
---
title: <Name>
order: <n>
---

<one-sentence framing of why someone picks this option specifically>

```<language>
<minimal working setup, no more than 10 lines>
```

<one sentence pointing at signup/docs/source>

## Options

```ts
interface <Name>Options { ... }
```

| Option | Default | Notes |
| --- | --- | --- |
| <provider-specific options only> |

See [Shared options](/guide/<topic>#shared-options) for ...

## <provider-specific sections, only when there's real differentiation>

## CI (when applicable)
```

**Topic page** (`guide/writing/params.md`, `guide/switching/overview.md`, `guide/getting-started/how-it-works.md`):

```
---
title: <Topic>
order: <n>
---

<one-sentence definition of what this page covers>

## <H2 per concept>

<code example>

<1-2 paragraph explanation>
```

#### Information hierarchy — canonical homes

For *every* concept, there is exactly **one** canonical home. Every other reference is a link.

| Concept | Canonical home |
|---|---|
| What `t()` is, params, plurals, selects, homonyms, rich text | `guide/writing/*` (`overview`, `params`, `plurals`, `selects`, `homonyms`, `rich-text`) |
| Number/date/list formatting, `Intl` overrides | `guide/formatting/*` |
| Locale switching, persistence (cookie/url/local-storage), `Accept-Language`, regional vs language, fallback | `guide/switching/*` (`overview`, `switch`, `persistence`, `tags`) |
| Save loop, rename detection, compile-time rewrite, call-site context | `guide/getting-started/how-it-works.md` |
| Install steps, CI patterns | `guide/getting-started/installation.md` |
| Config file (`yapyak.config.ts`) | `guide/getting-started/configuration.md` |
| CLI commands and flags | `cli/*` |
| Translator options (voice, glossary, context, examples, batching), providers | `guide/translating/*` |
| Error handling, retries, recovery table | `guide/translating/errors.md` |
| `createTranslator` API for custom providers | `guide/advanced/custom-translator.md` |
| `withResponse` for custom adapters | `guide/advanced/custom-adapter.md` |
| HMR behavior | `guide/advanced/hmr.md` |
| `YAP00xx` diagnostics | `diagnostics/*` |

If a page explains a concept that has a canonical home elsewhere, the page is **wrong**. Cut the explanation, link instead.

#### Terminology lock

Every yapyak term's canonical word and banned synonyms live in [[yapyak-terminology]]. Add new terms there.

#### Examples — good vs bad

**Bad:**
> *"yapyak is a revolutionary AI-powered i18n solution that empowers developers to ship localized apps faster than ever."*

**Good:**
> *"yapyak extracts strings on save and translates them with whatever AI you bring. No portal."*

---

**Bad:**
> *"We've built yapyak from the ground up for enterprise-grade scale."*

**Good:**
> *"yapyak is a local-first i18n library. Your AI key, your locale files, your repo."*

---

**Bad:**
> *"Translation has never been easier with our seamless integration."*

**Good:**
> *"Write `t('Save changes')`. Save the file. The browser updates through HMR."*

#### Where to inject tone — the half-funny pattern

Guide content drifts toward sterile reference-manual prose. The fix: each page carries droll observations that pass the calibration anchors above — *technically true*, *specific*, *quietly funny*. A voice line is eligible only if it matches an approved-voice anchor or a calibration-drill row already in this file; 0–2 per page. (Never attempt to mechanize whether a line is funny.)

| Page type | Tone budget | What it lands on |
|---|---|---|
| **Overview / Introduction** | 1-2 lines | The pain that drove yapyak's design choice (e.g. *"Without one, the server cheerfully serves everyone the default locale, every time."*) |
| **How-it-works** | 1-2 lines | Edge cases and what yapyak does when it gives up (e.g. *"yapyak treats it as a delete plus add, and the translation is lost. Fuzzy matching would silently rebind unrelated strings."*) |
| **API / Options reference** | 0-1 lines | Option tables, setup code, and command listings carry 0 droll observations. One column may carry a specific example (e.g. *"Set a voice ('friendly', 'terse', 'lawyer at a dinner party')."*). |
| **Translators (per-provider)** | 1 line | Genuine differentiation observation — *"Empirically strong on Japanese, Korean, Arabic, Hebrew."* / *"Without negotiating with a vendor."* |
| **Adapters (per-framework)** | 0-1 lines | One line of context may carry an observation only if the framework has a notable quirk. |
| **CLI reference** | 0-1 lines | Specific descriptions of behaviors that commonly surprise. |
| **Locales (regional vs language)** | 1-2 lines | The exactly-here-everyone-gets-confused topic — relate. *"This is the one place tags collapse."* |
| **Errors / Recovery** | 1 line | What the user sees when things fail — keep grounded, not dramatic. |

**Hard limit:** max 2 droll observations per page. More than that and the page reads as trying-too-hard.

#### Calibration drill — before/after

The goal isn't humor-as-decoration. It's *acknowledgment that a real person wrote this, and they have eyes on what hurts.*

**Generic claims (sterile) → Observed claims (with voice):**

| Sterile | Observed |
|---|---|
| *"Without one, server-rendered HTML always uses the default locale."* | *"Without one, the server cheerfully serves everyone the default locale, every time."* |
| *"If you ship a fully client-rendered app with no SSR, the locale lives entirely in the browser."* | *"If your app never renders on a server, you'll never need an adapter — the locale lives entirely in the user's browser."* |
| *"Useful for snapshot testing the translation pipeline."* | *"Useful for snapshot tests, where a translation drift is the kind of CI failure that surprises you at 4pm on a Friday."* |
| *"For privacy-strict teams, this satisfies compliance."* | *"For privacy-strict teams (legal, medical, defense), this is the only AI translation flow that satisfies compliance without negotiating with a vendor."* |
| *"Match the source string format."* | *"If the source has `{count}`, the translation must too. TypeScript stops you before your tech lead does."* |
| *"The translator picks one model by default."* | *"`gemini-2.5-flash` by default. `gemini-2.5-pro` when output quality matters more than billing."* |

**Anti-patterns — over-injection:**

| Don't | Why |
|---|---|
| *"yapyak makes i18n actually fun again."* | Marketing fluff. Cut. |
| *"Translation has never been easier."* | Comparative without referent. Cut. |
| *"Buckle up, you'll love this part."* | Meme-tier. Cut. |
| *"It's not just X — it's Y."* | Banned negation-padding. |
| *"yapyak just lets translations come along for the ride."* | Passive-cute. Rewrite active. |
| *"This is the i18n you've been waiting for."* | Prophet voice. Cut. |

**The line everyone aims for and most miss:**

A reader who's been writing i18n for 10 years should read a line and think *"yes, exactly — they got it."* That's the calibration target. Not a laugh. A *nod*.

#### Closing-line voice

The closing line of a long-form doc, README, or release post may be quietly emotional. Example:

> *"Built for our own needs, and shared in case others have felt the same friction."*

Earned only when the rest of the page has stayed grounded. One per page max.
