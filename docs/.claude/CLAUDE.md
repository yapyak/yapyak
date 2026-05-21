# yapyak docs site

This is the yapyak marketing + docs site. It's a TanStack Start app inside the yapyak monorepo, dogfooding the `yapyak` library itself.

## Imports — docs-site-specific conventions

(The root `yapyak/.claude/CLAUDE.md` already brings in `core-principle`, `comments`, `git`, `working-with-user`, `typescript/base`, `typescript/library`, `typescript/imports`, `typescript/package-json`, `typescript/versioning`, and `typescript/packages/tsup`. The imports below add what the docs site needs on top of that.)

@~/GitHub/agents/typescript/app.md
@~/GitHub/agents/typescript/react.md
@~/GitHub/agents/typescript/react-app.md

@~/GitHub/agents/css/modules.md
@~/GitHub/agents/css/rules.md
@~/GitHub/agents/css/design-tokens.md

@~/GitHub/agents/typescript/packages/tanstack-router.md
@~/GitHub/agents/typescript/packages/tanstack-start.md

@~/GitHub/agents/docs/voice.md
@~/GitHub/agents/docs/structure.md

---

## yapyak-site overrides

These deviations apply specifically to `yapyak/docs/`:

- **i18n uses `t()` from `yapyak` directly.** No `defineTranslation` / `useTranslation` / `src/lib/intl.ts` wrapper — we're dogfooding the library:
  - `import { t } from 'yapyak'`
  - All user-facing strings go through `t('...')`. No `useTranslation` hook.
  - Locale switching uses `useLocale()` from `yapyak/react`.
  - The source string IS the key. No `{subject}{Component}{Prop}` key conventions.
- **Design tokens live in `src/style.css`** as CSS custom properties (`--bg`, `--text`, `--mint`, `--space-*`, `--radius-*`, etc.) — not under `@skiftle/ui/styles`. CSS Modules conventions otherwise per `css/modules.md`.
- **No `@skiftle/api` types.** We don't have a backend. Types come from `yapyak`'s public exports and from each route's own data shape.
- **No `useMutation` from `#hooks/useMutation`.** No backend. If a route needs an action (rare on a docs site), use a server function or plain `fetch` directly.
- **Loaders return Markdown content** for `/guide/$slug` routes. The shape is `{ title, description, content }` parsed from frontmatter — pass through to the component unchanged.
- **Path aliases** `#components/*` and `#lib/*` are wired via package.json `imports` and tsconfig `paths`. Use them for cross-folder imports, not relative paths.

## The yapyak ethos

The thesis that underlies every page, every feature, every line of copy:

> **Translation is part of the local dev loop — not a project beside it.**
> You write code. yapyak handles i18n. Locally. Without a portal.

Everything else follows from that.

### The five underlying beliefs

1. **Local beats portal.** Locale files live in the repo, get committed via git. No dashboard, no seat-model, no "Contact sales".

2. **The source string is the contract.** The English you write IS the key. No `t('common.buttons.save_v2')`. No `.d.ts` to maintain. What Tailwind did for class names, yapyak did for i18n keys.

3. **AI is useful — when it has context.** Not magic. Not perfect. But useful when it knows you're writing inside a `<button>` in `<SaveDialog>`, with voice "casual" and glossary `"Cart" → "Korg"`. And always optional. Skip AI entirely if you want.

4. **No margin on your tokens.** You bring your own API key. Anthropic, OpenAI, Gemini, Ollama, or a custom translator in 30 lines. yapyak never sees your tokens.

5. **Behind all the AI talk, yapyak is a normal modern i18n library.** Plurals, dates, lists, ordinals, framework adapters, CLI, manual workflow, rename-detection. The boring stuff works.

### Lift the non-business-model angle early

In any long-form doc, README, or release post, the *"yapyak has no business model"* and *"bring your own AI"* points should appear early — typically in the first one or two paragraphs after the thesis. This is not a footer disclaimer or fine-print beat. It's a core promise that shapes how the reader frames everything else.

Phrasings that work:

- *"Your AI key. Your locale files. yapyak has no business model."*
- *"yapyak never sees your tokens."*
- *"A library on npm. MIT-licensed. No portal."*

---

## yapyak-specific docs conventions

The generic voice and structure rules live in `agents/docs/voice.md` and `agents/docs/structure.md` (imported above). What follows is yapyak-flavored: brand conventions, canonical examples, terminology, page templates, the tone budget.

### Brand conventions

- **`yapyak`** — always lowercase in prose, even at sentence start. Like `npm`, `iPhone`, `eBay`.
- **`t()`** — code-formatted (backticks) when referring to the function.
- **HTTP headers** — canonical casing in prose: `Accept-Language`, `Cookie`, `Authorization`. Not `accept-language`, even though the wire format is case-insensitive.
- **TypeScript identifiers** keep their casing as defined: `YapyakOptions`, `TIn`, `AnthropicOptions`. These follow code conventions, not brand conventions.

### Subject is yapyak or the reader — never "we" or "I"

Reinforces the generic active-voice rule with yapyak-specific examples.

| Tempted to write | Write instead |
|---|---|
| *We extract strings on save.* | *yapyak extracts strings on save.* |
| *We pass call-site context to the AI.* | *yapyak passes call-site context to the AI.* |
| *I built this because…* | *yapyak treats translation as part of the local dev loop.* |
| *We don't take a margin on AI.* | *yapyak never sees your tokens.* |
| *Let's add a translator.* | *Add a translator like this:* |

(Exception: changelog entries, blog/release posts, and `README.md` may use "I" / "we" since they're authored statements. Docs are not.)

### Voice signature — calibration anchors

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

### yapyak-flavored banned phrasings (in addition to the generic banned vocabulary)

Tautological closers and yapyak-shaped cute-speak:

- *"X just lets Y come along for the ride."* — passive-cute. Rewrite as active.
- *"Adding a Z is one Z, not a pipeline."* — over-clever inversion.
- *"yapyak just lets translations come along for the ride."*

### Lead with code blocks, not inline code

The example is the explanation — but it should be a small *code block*, not endless backticks scattered in prose. Inline `code` is for naming a specific identifier, not for showing usage.

- ✓ Write a short code block showing `t('Save changes')` in context. Body prose stays clean.
- ✗ *"Call `t()` with a `source` string and optional `params` for `{placeholder}` interpolation against the `Intl` primitives configured in `yapyak.config.ts`."* — every other word is in backticks. Show, don't sprinkle.

Rule of thumb: if a sentence has 3+ inline `code` spans, replace it with a small code block.

### Canonical examples

One canonical set used everywhere. Don't invent throwaway examples.

- **Canonical example string**: `t('Save changes')`. Use `t('Hello, {name}!')` only when illustrating interpolation specifically.
- **Canonical filename**: `save-button.tsx`.
- **Canonical component name**: `SaveButton`.
- **Canonical locale pair**: `en` (source) → `sv` (translated). Use `es`/`fr`/`de`/`ja` only when illustrating *multiple* locales.

### Examples never show explicit return types

Guide code examples target what a *reader would write*, not what the library's `isolatedDeclarations` setting enforces internally. Inference is the everyday TypeScript flow. Don't import `ReactElement` / `JSX.Element` just to annotate the return.

```tsx
// ✗ Banned in examples
import type { ReactElement } from 'react';
function Component(): ReactElement {
  // ...
}

// ✓ Acceptable in examples
function Component() {
  // ...
}
```

Same rule for arrow functions. The point of the example is the surrounding logic, not annotation discipline. (yapyak's own library code follows `isolatedDeclarations`, but that's an internal-correctness concern, not an example-pedagogy concern.)

### Page-type templates

yapyak's three canonical page skeletons. Mirror them exactly.

**Concept introduction page** (`<topic>/introduction.md`, `adapters/introduction.md`, `translators/introduction.md`):

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

**Topic page** (`translations.md`, `locales.md`, `how-it-works.md`):

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

### Information hierarchy — canonical homes

For *every* concept, there is exactly **one** canonical home. Every other reference is a link.

| Concept | Canonical home |
|---|---|
| What `t()` is, params, plurals, forced locale | `translations.md` |
| Auto-discovery, persistence (cookie/localStorage), `Accept-Language`, regional vs language, fallback | `locales.md` |
| Save-loop, rename detection, compile-time rewrite, AI context object | `how-it-works.md` |
| Install steps, CI patterns | `installation.md` |
| CLI commands and flags | `cli.md` |
| Adapter concept (what + when not needed) | `adapters/introduction.md` |
| Shared translator options (voice, glossary, context, batchSize, etc.) | `translators/introduction.md` |
| Error handling, retries, recovery table | `translators/introduction.md` |
| `createTranslator` API for custom providers | `translators/custom.md` |
| `withRequest` for custom adapters | `adapters/custom.md` |

If a page explains a concept that has a canonical home elsewhere, the page is **wrong**. Cut the explanation, link instead.

### Terminology lock — yapyak terms

| Concept | The word | Banned alternatives |
|---|---|---|
| The translation function | `t()` | `the translate function`, `the t helper` |
| A configured `t()` invocation | **call site** | call location, invocation site, t() spot |
| The user's source-language string | **source string** | source text, key, source key, English (when language-agnostic) |
| The JSON files under `locales/` | **locale files** | translation files, i18n JSON, translation JSON, language files |
| What the AI receives | **call-site context** | context payload, request context, translation hint |
| What the Vite plugin produces | **inlined object** / **inlined variants** | compiled translations, baked translations, baked-in translations |
| The configured AI providers | **translator** (singular) / **translators** | provider, AI provider, model provider, AI service |
| The adapter package for a framework | **adapter** | wrapper, integration, plugin (no — Vite *plugin* is the plugin) |
| `defaultLocale` runtime behavior | **default locale** | source locale, fallback locale, base locale |
| Per-call locale override | **forced locale** (via `t.in()`) | locked locale, scoped locale, fixed locale |

When introducing a new term, add it to this table. When two writers reach for two words for the same thing, the table picks the winner.

### Examples — good vs bad

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

### Where to inject tone — the half-funny pattern

Guide content drifts toward sterile reference-manual prose. The fix: each page carries **one to two droll observations** that pass the calibration anchors above — *technically true*, *specific*, *quietly funny*.

| Page type | Tone budget | What it lands on |
|---|---|---|
| **Overview / Introduction** | 1-2 lines | The pain that drove yapyak's design choice (e.g. *"Without one, the server cheerfully serves everyone the default locale, every time."*) |
| **How-it-works** | 1-2 lines | Edge cases and what yapyak does when it gives up (e.g. *"yapyak treats it as a delete plus add, and the translation is lost. Fuzzy matching would silently rebind unrelated strings."*) |
| **API / Options reference** | 0-1 lines | Resist humor in option tables. One column may carry a specific example (e.g. *"Set a voice ('friendly', 'terse', 'lawyer at a dinner party')."*). |
| **Translators (per-provider)** | 1 line | Genuine differentiation observation — *"Empirically strong on Japanese, Korean, Arabic, Hebrew."* / *"Without negotiating with a vendor."* |
| **Adapters (per-framework)** | 0-1 lines | Don't inject humor in setup code. One line of context may carry observation if framework has notable quirk. |
| **CLI reference** | 0-1 lines | Specific descriptions of behaviors that commonly surprise. Resist over-decorating commands. |
| **Locales (regional vs language)** | 1-2 lines | The exactly-here-everyone-gets-confused topic — relate. *"This is the one place tags collapse."* |
| **Errors / Recovery** | 1 line | What the user sees when things fail — keep grounded, not dramatic. |

**Hard limit:** max 2 droll observations per page. More than that and the page reads as trying-too-hard.

### Calibration drill — before/after

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

### Closing-line voice

The closing line of a long-form doc, README, or release post may be quietly emotional. Example:

> *"Built for our own needs, and shared in case others have felt the same friction."*

Earned only when the rest of the page has stayed grounded. One per page max.
