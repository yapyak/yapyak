# CLAUDE.md

This is the yapyak marketing + docs site. It's a TanStack Start app inside the yapyak monorepo, dogfooding the `yapyak` library itself.

## yapyak-site overrides

The rules below this section are copied verbatim from the skiftle frontend codebase, since they capture the conventions we want for any React/TanStack site we ship. The following deviations apply specifically to `yapyak/site/`:

- **i18n uses `t()` from `yapyak` directly.** Ignore the `defineTranslation` / `useTranslation` / `src/lib/intl.ts` pattern described later in this file. In yapyak/site:
  - `import { t } from 'yapyak'`
  - All user-facing strings go through `t('...')`. No `useTranslation` hook.
  - Locale switching uses `useLocale()` from `yapyak/react`.
  - No translation key conventions (no `{subject}{Component}{Prop}` camelCase keys). The source string IS the key.
- **Styling is CSS Modules**, same conventions as described later in this file. Design tokens live in `src/style.css` as CSS custom properties (`--bg`, `--text`, `--mint`, `--space-*`, `--radius-*`, etc.). Components have `.module.css` siblings, PascalCase classes, nested children, `@layer components`.
- **No `@skiftle/api` types.** We don't have a backend. Types come from `yapyak`'s public exports and from each route's own data shape.
- **No `useMutation` from `#hooks/useMutation`.** Same reason — no backend. If a route needs an action (rare on a docs site), use a server function or plain `fetch` directly.
- **Mutation/confirm/toast conventions are still useful** as patterns — apply them if/when the site grows interactive features (search, locale switcher feedback, etc.).
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

Phrasings to avoid:

- ✗ *"Free forever!"* — sounds like a SaaS marketing claim
- ✗ *"100% open source"* — generic, fluffy
- ✗ *"Bring your own AI to save on costs."* — frames it as cost-saving, not as principle

The point isn't that yapyak is *cheap*. The point is that yapyak is *not in the business* of selling AI access. That distinction matters.

### Voice signature — these lines feel like yapyak

> *"Edit. Save. Done."* — terse, declarative, no second step.
>
> *"What Tailwind did for class names, yapyak did for keys."* — anchor the idea in something the reader already understands.
>
> *"Built for our own needs, and shared in case others have felt the same friction."* — closing-line warmth without self-importance.

### The underlying feeling

yapyak is the library you wish a competent colleague had built. Someone tired of the industry's bullshit who just fixed it. Doesn't try to impress you. Doesn't claim to have solved something magic. Opened GitHub, slapped on an MIT license, and said: *"Here. Use it if you want. Or don't."*

Every doc, every README section, every release note, every marketing line should feel like it was written by that person — not by a marketing team, not by an LLM that has digested 10,000 SaaS landing pages.

## Documentation tone

All `.md` files under `content/` and any marketing copy on the site follow these rules. yapyak docs are written like an honest engineer talking to a fellow engineer — not marketing copy, not corporate documentation. Personal, precise, anti-fluff.

### Voice rules

1. **Never use "I" or "we" in docs.** The subject is either *yapyak* or *the reader*.
   - ✓ "yapyak extracts the string on save."
   - ✓ "You write `t('Save changes')`."
   - ✗ "We extract the string on save."
   - ✗ "I built yapyak to solve…"

   (Exception: changelog entries, blog/release posts, and `README.md` may use "I" / "we" since they're authored statements. Docs are not.)

2. **Short declarative sentences.** Multiple periods beat commas.
   - ✓ *"Not perfect. Not magic. But useful."*
   - ✗ *"While not perfect, the system is useful when properly configured."*

3. **Lowercase brand.** Always `yapyak`. Never `Yapyak`, `YAPYAK`, or `Yap Yak`.

4. **Lead with code blocks, not inline code.** The example is the explanation — but it should be a small *code block*, not endless backticks scattered in prose. Inline `code` is for naming a specific identifier, not for showing usage.
   - ✓ Write a short code block showing `t('Save changes')` in context. Body prose stays clean.
   - ✗ *"Call `t()` with a `source` string and optional `params` for `{placeholder}` interpolation against the `Intl` primitives configured in `yapyak.config.ts`."* — every other word is in backticks. Show, don't sprinkle.
   - Rule of thumb: if a sentence has 3+ inline `code` spans, replace it with a small code block.

5. **State the negative space.** What yapyak *isn't* is as important as what it is.
   - ✓ *"No translation keys. No default `en.json`. No portal."*

6. **Dry humor at observation-level, never jokes.** Specific, slightly absurd, or self-aware lines are encouraged — but they land as a *droll observation*, not a punchline. They should be inseparable from the technical claim they decorate.

   Calibration anchor — these are the level we want:
   - *"Forget a `{count}` placeholder and TypeScript stops you before your tech lead does."*
   - *"Yes, all four Polish plural forms."*
   - *"Set a voice ('friendly', 'terse', 'lawyer at a dinner party')."*
   - *"Even when the AI thinks it knows better."*
   - *"Next.js? Open a PR."*
   - *"No 'Contact sales'. Other i18n services mark up your AI bill 5x. yapyak never sees your tokens."*

   Each line above passes the test: it is *technically true*, *specific*, and *quietly funny*. None of them are punchlines or set-ups for laughter.

   Below the line — never write:
   - ✗ *"AI go brrr 🚀"*
   - ✗ *"Translation: solved!! 🎉"*
   - ✗ *"Buckle up, this is gonna blow your mind."*
   - ✗ *"yapyak go brr"* / *"Just sprinkle some t() on it"* / wink-wink references to memes.

   The difference: feature-list-level humor *informs* while it amuses. Meme-level humor *only* amuses, and breaks tone.

7. **Acknowledge alternatives.** Don't pretend the reader has no choice.
   - ✓ *"Or skip AI entirely."*
   - ✗ *"yapyak requires an AI translator to function."* (when it doesn't)

8. **Honest about limitations.** Premium ≠ flawless.
   - ✓ *"Not perfect. Not magic."*
   - ✗ *"Flawless translations every time."*

### No AI-tone — this is non-negotiable

LLM-written prose has a *texture* that humans recognize instinctively. The texture is rhythmic, repetitive, listy, and over-balanced. yapyak docs must not sound like that. Avoid these tells, even when individual instances seem fine:

#### Banned patterns

1. **Anaphora lists** ("No X. No Y. No Z." style):
   - ✗ *"No lock-in. No cloud. No enterprise."*
   - ✗ *"No dashboard. No login. No portal."*
   - ✗ *"Built for X. Built for Y. Built for Z."*

   This is the single most recognizable AI cadence. Allowed *once* per page max, only when it serves a real rhetorical beat (e.g., a manifesto-style closer). Default: write a normal sentence.

2. **Numbered prose** ("First / Second / Third"):
   - ✗ *"First, install the package. Second, configure the plugin. Third, write your strings."*
   - ✓ Use a numbered list, or just write naturally: *"Install the package, configure the plugin, write your strings."*

3. **"Not just X — Y"** / **"It's not about X, it's about Y"** — banned. AI overuses this contrast pattern.

4. **Tricolons** in prose (three parallel clauses): one is fine, three on a page is a tell.

5. **Transition adverbs**: *furthermore, moreover, additionally, that said, what's more.* Cut them.

6. **"Whether you're X or Y…"** — banned. The textbook AI opener for inclusive language.

7. **Em-dash overuse** — using `—` more than once or twice per page reads as AI. Prefer periods.

8. **Negation padding** — claims followed by an immediate *"not X"* rebuttal of an unstated alternative:
   - ✗ *"yapyak treats translation as part of the local dev loop, not a project beside it."*
   - ✗ *"It's not just a library — it's a way of thinking about i18n."*
   - ✗ *"Built for shipping, not for portals."*
   - ✗ *"We made it simple, not simplistic."*

   This is one of the most recognizable AI rhetorical patterns. It manufactures depth by inventing a phantom alternative and dismissing it. If the positive claim is strong enough, the contrast adds nothing. If it isn't, write a stronger claim.

   The fix is to formulate the positive statement so completely that no contrast is needed:
   - ✓ *"yapyak generates translations on save."*
   - ✓ *"yapyak is a library on npm. MIT-licensed."*
   - ✓ *"Built for shipping."*

   When you catch yourself writing *"X, not Y"* or *"not just X, but Y"* — stop and rewrite the X side so it carries the whole weight.

9. **Unicode ellipsis `…` in code or values** — banned. Always use three ASCII dots `...`. The Unicode ellipsis (U+2026) is an LLM auto-fill habit. Real engineers type three periods.

   ✗ Banned:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-…
   ```
   ```ts
   anthropic({ apiKey: '…', voice: '…' })
   ```

   ✓ Fix:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   ```
   ```ts
   anthropic({ apiKey: '...', voice: '...' })
   ```

   In prose, Unicode `…` is also weak — most cases want a real punctuation rewrite, not an ellipsis. Prefer rewriting sentences over trailing them off.

10. **Decorative arrows inside code blocks** — the *"line — let me kindly explain what this line means"* pattern. Strictly forbidden:

   ✗ Banned:
   ```
   locales/
     es.json    ← Spanish locale exists
     fr.json    ← French locale exists
     de.json    ← German locale exists
   ```

   ✗ Also banned:
   ```ts
   yapyak({
     persistence: 'cookie',   ← stores the locale across sessions
     translator: anthropic(), ← Claude does the translation
   })
   ```

   This is one of the loudest LLM tells. Real engineers either let the code speak for itself (filenames, identifiers, types already say what's what), use syntax-native comments (`//`, `#`, `/* */`), or explain in the prose around the code block. Never decorate code lines with `←` / `→` annotations.

   ✓ Fix — let the code stand alone, explain in prose:
   ```
   locales/
     es.json
     fr.json
     de.json
   ```
   With prose around it: *"Whatever JSON files exist in `locales/` are your non-default locales."*

   ✓ Fix — use real syntax-comments when annotation is genuinely needed:
   ```ts
   yapyak({
     persistence: 'cookie',     // SSR-safe (recommended)
     translator: anthropic({...}),
   })
   ```

   Arrows are fine in *prose* for transformations (e.g. *"`save-button.tsx` → `SaveButton`"*) or in flow diagrams. Just never as inline code-block decoration.

### Determinism — page structure is fixed

Every page of a given type follows the same skeleton, in the same order, using the same vocabulary. Two pages of the same type should read like the same author wrote them on the same day. No improvisation.

#### Page-type templates

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

**Detail page** (any provider/adapter/specific implementation page):
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

#### Information hierarchy — what lives where

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

#### Cross-reference format

One format for every link to another doc page. Use it verbatim:

> See [Section name](/guide/path#anchor) for X.

Examples:
- ✓ *"See [Persistence](/guide/locales#persistence) for cookie configuration."*
- ✓ *"See [Shared options](/guide/translators#shared-options) for `voice`, `glossary`, `context`."*
- ✗ *"For more on this, check out the persistence section..."*
- ✗ *"Persistence is documented over on the Locales page."*

No prose variations on "see". No "head over to", "check out", "more info at".

#### Terminology lock

Same concept, same word, every page. No synonyms.

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

#### Section-heading conventions

Same heading text for same concept across pages. Don't paraphrase:

- *"Options"* — never *"Configuration"*, *"Settings"*, *"Parameters"*.
- *"CI"* — never *"Continuous integration"*, *"Build pipeline"*.
- *"Picking a model"* — never *"Choosing a model"*, *"Model selection"*.
- *"What X does"* — never *"How X works"* (reserve "How it works" for `how-it-works.md`).
- *"When you don't need one"* — never *"Skip this section"*, *"Opt-out cases"*.

#### Headings are labels, not narrative

Two hard bans:

1. **No numbered headings.** *"`## 1. Install the package`"*, *"`## Step 2: Configure`"* — banned. AI loves numbering everything, and sequence is communicated by section order plus an opening line in prose (e.g. *"Three steps to a translated string."*). Numbered headings also produce ugly anchor slugs (`#1-install-the-package`), shift on insertion, and read as LLM-template output in the sidebar.

   ✗ `## 1. Install the package`
   ✗ `## Step 1: Install`
   ✓ `## Install`
   ✓ `## Install yapyak`

2. **No inline code in headings.** *"`## Add the plugin to vite.config.ts`"* (with backticks around `vite.config.ts`) — banned. Backticks render inconsistently across themes, anchor slugs become unreadable (`#add-the-plugin-to-vite-config-ts`), and headings should be ognable at scan-speed. Move the filename to the first sentence of the section body where it can be properly code-styled.

   ✗ `` ## Add the plugin to `vite.config.ts` ``
   ✗ `` ## The `t()` function ``
   ✓ `## Configure Vite` → body: *"Add the plugin to `vite.config.ts`:"*
   ✓ `## The runtime API` → body: *"`t()` takes a source string literal..."*

   The body is for code. The heading is for the label.

#### Opening-sentence rule

Every page's opening sentence:
1. Names the subject in the first three words
2. States what it *does* (not why it exists)
3. Is one sentence — no preamble

✓ *"`t()` is the runtime API. It takes a source string literal and optional params, and returns the right variant for the current locale."*
✓ *"An adapter wires yapyak to your favorite SSR framework so each request renders in its own locale."*
✓ *"yapyak generates translations on save."*

✗ *"This page covers..."*
✗ *"Let's talk about..."*
✗ *"In this guide, we'll explore..."*

#### Code-example consistency

- **One canonical example string** project-wide: `t('Save changes')`.
- **One canonical filename** for the call site: `save-button.tsx`.
- **One canonical component name**: `SaveButton`.
- **One canonical locale pair for examples**: `en` (source) → `sv` (translated). Use `es`/`fr`/`de`/`ja` only when illustrating *multiple* locales.

If you need a fresh example (placeholder demo, plural demo), introduce a single new canonical one and reuse it. Don't invent throwaway examples.

#### The single-source rule

> Each concept lives in exactly one file. Every other mention is a link.

This is the most violated rule. The audit pass catches it. To prevent regression:
- Before writing more than two sentences explaining a concept, check the canonical-home table above.
- If the concept has a home elsewhere — delete what you wrote, write a link sentence instead.
- If the concept *doesn't* have a home — establish one (add to the table) and write the explanation there. Other pages link.

### Say it once. Then stop.

- Find the **single shortest sentence** that says the thing. If two sentences say the same thing twice, delete one.
- ✗ *"yapyak extracts your strings on save. The strings are automatically pulled out of your code whenever you hit save."*
- ✓ *"yapyak extracts strings on save."*

If you find yourself adding a second sentence for "extra emphasis", you don't need it. Trust the reader.

### Plain English, not fancy English

- Prefer short common words. *use* > *utilize*. *help* > *facilitate*. *let* > *enable*. *need* > *require*. *show* > *demonstrate*.
- Avoid Latinate vocabulary when an Anglo-Saxon word works.
- ✗ *"yapyak facilitates the automatic generation of translation artifacts."*
- ✓ *"yapyak writes the translation files for you."*

The reader is a competent engineer, not someone you're trying to impress with vocabulary.

### Banned vocabulary

Marketing words that ring fake:
> revolutionary, cutting-edge, world-class, enterprise-ready, powerful and flexible, robust, seamless, seamlessly, leverage, empower, unlock, supercharge, harness, transform, next-generation, lightning-fast, blazing-fast, blazingly, effortlessly, elegantly, production-ready, out of the box

Marketing prefixes / suffixes:
> AI-powered, AI-driven, AI-native, AI-first (the modifier almost always adds zero meaning — say what it actually does instead)

Cute-speak:
> magic, magical, automagically, made with love, crafted with care, hand-crafted, sprinkle on, just X (as in "just sprinkle some t() in your code"), simply X

Apple-imitator clichés (avoid even when tempted):
> "It just works.", "Designed for X.", "Made for X."

Corporate phrases:
> "contact sales", "seat model", "industry-leading", "best-in-class", "speak to our team", "enterprise tier"

Hype openers:
> "We're excited to announce", "Introducing the next generation of…", "Just X simple steps"

Tautological closers:
> "No X to wire up. No Y to configure. No Z to maintain." (the AI's favorite ending — see "Banned patterns" above)
> "X just lets Y come along for the ride." (passive-cute construction; rewrite as active)
> "Adding a Z is one Z, not a pipeline." (over-clever inversion)

### Cliché AI sentence shapes

Avoid these *structural* tells, regardless of which words fill them:

- **"Welcome to the X era."** — "AI era", "agent era", "post-X era".
- **"This is what X looks like in 20YY."** — pseudo-prophet voice.
- **"The Y agents/devs/teams would build themselves."** — over-claiming inevitability.
- **"For an AI agent, X is the whole change."** — when X is one tiny thing.
- **"Whatever the user reads, the agent reads."** — triple-actor parity claims.
- **"Built around the way agents think."** — projection / anthropomorphism.

If a sentence reads like it could appear on any other dev-tool landing page, cut it.

### Brand convention details

- **`yapyak`** — always lowercase in prose, even at sentence start. Like `npm`, `iPhone`, `eBay`.
- **`t()`** — code-formatted (backticks) when referring to the function.
- **HTTP headers** — canonical casing in prose: `Accept-Language`, `Cookie`, `Authorization`. Not `accept-language`, even though the wire format is case-insensitive.
- **TypeScript identifiers** keep their casing as defined: `YapyakOptions`, `TIn`, `AnthropicOptions`. These follow code conventions, not brand conventions.
- **Canonical example string**: `t('Save changes')`. Don't invent new placeholder strings unless the example specifically needs something else (e.g. `t('Hello, {name}!')` for interpolation).

### Structure

- **Open with what it does**, not why it exists.
- **Bullet lists** are fine, but periods make sentences breathe better than dashes.
- **Don't oversell.** If something is small, say it's small.
- **Closing line** may be quietly emotional. Example:
  > *"Built for our own needs, and shared in case others have felt the same friction."*

### Subject substitution

When tempted to write "we" or "I", use yapyak or the reader:

| Tempted to write | Write instead |
|------------------|---------------|
| *We extract strings on save.* | *yapyak extracts strings on save.* |
| *We pass call-site context to the AI.* | *yapyak passes call-site context to the AI.* |
| *I built this because…* | *yapyak treats translation as part of the local dev loop.* |
| *We don't take a margin on AI.* | *yapyak never sees your tokens.* |
| *Let's add a translator.* | *Add a translator like this:* |

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

### Emojis

Maximum one per page. Brand emoji 🐃 only when natural (e.g. release post title). Never decorative inside body content.

### Where to inject tone (the half-funny pattern)

Guide content has a tendency to drift toward sterile reference-manual prose. The fix: each page should carry **one to two droll observations** that pass the rule above — *technically true*, *specific*, *quietly funny*.

**Guidance per page type:**

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

**Test for each candidate line:**
1. Is the technical claim accurate without the humor part? (If no — fix the claim first.)
2. Does the humor part *observe* something real, not invent it?
3. Would a competent engineer chuckle on first read but not feel sold-to?
4. Is it inseparable from the technical claim, or could it be cut without losing information?

If you can't say yes to all four, cut.

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

## Formatting

- **MANDATORY: Run `pnpm check:write` after every code change.** No exceptions. The command runs Biome with `--write` from the repo root and handles formatting, lint, and import ordering. Skip this and PRs bounce.
- **Never leave comments in code.** No inline `//`, no block `/* */`, no JSDoc on internal symbols. Code should be self-explanatory through naming. The only exception is when a comment is the sole way to communicate non-obvious intent (rare — fix the code first).

## File Naming

All files and folders use **kebab-case**. No exceptions — `.ts`, `.tsx`, `.module.css`, folders, everything.

**Top-level files:** Filename matches the primary export **by spelling**, not casing: `useTheme` → `use-theme.ts`, `ButtonGroup` → `button-group.tsx`, `createArrayNode` → `create-array-node.ts`.

**The naming rule (deterministic, mechanical):**

- `ComponentName = PascalCase(parent-folder-name) + PascalCase(filename)`
- Top-level files (directly under `components/`): just `PascalCase(filename)`
- Root CSS class in the matching `.module.css` always equals the component name (1:1)
- Props type follows the same rule: `NodeHeadingProps`, not `HeadingProps`

**`parent-folder-name` means the immediate parent only — never ancestors.** At any nesting depth, only the folder directly above the file contributes to the name. Grand-parent folders are not included.

```
components/
  block-renderer.tsx                  → BlockRenderer       → .BlockRenderer
  block-renderer.module.css
  block-renderer/
    node.tsx                          → BlockRendererNode   → .BlockRendererNode
    node.module.css
    node/
      heading.tsx                     → NodeHeading         → .NodeHeading
      heading.module.css
      code-block.tsx                  → NodeCodeBlock       → .NodeCodeBlock
      code-block.module.css
      list-item.tsx                   → NodeListItem        → .NodeListItem
      list-item.module.css
```

The full ancestor chain is carried by the **file path**, not by the component name or the CSS class. Don't repeat what the filesystem already says. CSS Modules guarantee global uniqueness at build time — the class label is only a local identifier inside its file. The 1:1 match with component name keeps the mental model uniform: every component has one root class with the same name.

**Child CSS classes follow the same parent prefix.** Inside `heading.module.css`, the root is `.NodeHeading` and children are `.NodeHeadingIcon`, `.NodeHeadingLeadingBadge` etc — same prefix rule.

**The constitutional rule that makes the prefix meaningful:**

A folder exists if and only if a sibling `.tsx` file with the same name exists. That sibling is the folder's owner. The folder's name therefore matches a real component — never a generic grouping label.

```
components/
  dialog.tsx        ← owner of dialog/
  dialog/
    header.tsx      ← parent prefix is the real `Dialog` component
```

What this guarantees:
- Parent-folder prefixes are always anchored to a real component. They carry semantic weight by construction.
- The structure cannot grow generic grouping folders (`parts/`, `internal/`, `common/`, etc.) because no corresponding `.tsx` exists to legitimize them.

What it does not guarantee:
- That a component was wisely named. If someone names a component `Atom` carelessly, its children inherit the `Atom` prefix. Name components well — the folder rule only ensures the prefix is anchored to a real component.

### Components (`components/`)

**Top-level files are the public API. Folders contain private internals.**

**What counts as "public":** consumed by a route file OR by 2+ other components OR genuinely reusable across contexts. Public components live at `components/X.tsx`.

**What counts as "private/internal":** consumed by only ONE other component. Internal components live inside that parent's folder at `components/parent/X.tsx`. Never at root.

Example: `HeroDemo` is consumed only by `Hero`. It's NOT at `components/hero-demo.tsx` — it's at `components/hero/demo.tsx` (exported as `HeroDemo`). If a third component starts importing `HeroDemo`, it gets promoted to a top-level file.

**TOTALLY FORBIDDEN: plural component names.** Never `locales.tsx`, `examples.tsx`, `items.tsx`, `tabs.tsx`, etc. Always singular noun + element-type suffix from the Element vocabulary: `LocaleStack`, `ExampleSection`, `ItemRow`, `TabBar`. The plural is encoded in the element type (`List`, `Stack`, `Section`, `Grid`), not the noun.

**`List` is reserved for `<ul>` / `<ol>` elements only.** If the element renders as a `<div>` with `flex-direction: column`, it's a `Stack`. If it's a `<section>` with a heading and body, it's a `Section`. Match the suffix to the actual DOM.

```
✗ locales.tsx          → Locales         (plural, missing element)
✓ locale-stack.tsx     → LocaleStack     (singular + Stack — renders as <div> flex column)

✗ examples.tsx         → Examples
✓ example-section.tsx  → ExampleSection  (singular + Section — renders as <section> with heading)

✗ returns.tsx          → Returns         (looks plural; "Returns" is the section content)
✓ return-section.tsx   → ReturnSection   (singular + Section)
```

```
components/
  wordmark.tsx                ← public (single-file component)
  wordmark.module.css

  button.tsx                  ← public (compound component owner)
  button.module.css
  button/                     ← internals
    text.tsx
    text.module.css
    icon.tsx

  dialog.tsx                  ← public
  dialog/                     ← internals
    content.tsx
    content.module.css
    header.tsx
    footer.tsx
    trigger.tsx
    use-trigger.ts            ← component-specific hook (stays internal)
    actions.ts                ← component-specific data (stays internal)
```

**Rules:**

- **Top-level files are publicly importable.** Anything imported via `#components/X` resolves to `components/X.tsx`.
- **Folder matches its top-level file.** `button/` belongs to `button.tsx`. The folder contains internals not exported as standalone modules.
- **No `index.ts` files.** The top-level `.tsx` IS the entry. Compound parts attach via `Component.Sub = SubComponent` pattern (see *Compound components*).
- **Single-file components don't need a folder.** Just `wordmark.tsx` + `wordmark.module.css`.
- **CSS modules co-locate.** `button.module.css` next to `button.tsx`. Internals have their own `.module.css` inside the folder.
- **Component folders contain ONLY components.** No `.ts` data files, no hooks, no utilities — only `.tsx` (sub-components) and `.module.css`.
- **Hooks always go to `hooks/`.** Even if used by exactly one component. Naming: `use-demo-state.ts`, accessed via `#hooks/use-demo-state`.
- **Utilities and data always go to `utils/`.** Even if used by exactly one component. Or inline directly into the component file if it's small and tightly coupled (a `FEATURES = [...]` array etc).
- **Choose between inline and `utils/` based on size and reuse:** 5-line constant → inline. 50-line data array → `utils/`. Helper function → `utils/`. Hook → `hooks/`. No middle ground inside the component folder.

### Imports

Two rules cover everything:

1. **Cross-domain imports use aliases**: `#components/*`, `#hooks/*`, `#lib/*`, `#utils/*`, `#docs/*`.
2. **Imports inside a component's own folder use relative paths**: `button.tsx` imports `./button/text`, not `#components/button/text`.

| From | To | Import |
| --- | --- | --- |
| `routes/foo.tsx` | `components/button.tsx` | `import { Button } from '#components/button'` |
| `components/button.tsx` | `components/button/text.tsx` | `import { ButtonText } from './button/text'` |
| `components/button/text.tsx` | sibling `components/button/icon.tsx` | `import { ButtonIcon } from './icon'` |
| `components/button.tsx` | `hooks/use-press.ts` | `import { usePress } from '#hooks/use-press'` |
| `components/button.tsx` | `lib/cn.ts` | `import { cn } from '#lib/cn'` |

The point: `./` means "inside this component". `#` means "from elsewhere in the codebase". Reading an import tells you the boundary instantly.

### Primitives (`primitives/`) and Systems (`systems/`)

Grouped by concern. Flat files within each concern:

```
primitives/
  interaction/
    press/
      use-press.ts
      use-pressable.ts
      press-event.ts
      index.ts
    hover/
      use-hover.ts
      use-hoverable.ts
      index.ts
  foundation/
    box.tsx
    index.ts
systems/
  theme/
    theme-context.ts
    theme-provider.tsx
    constants.ts
    types.ts
    index.ts
```

## React Rules

### Components

- Named exports only, never default exports
- Props type is an exported interface in the same file: `export interface ComponentNameProps`
- Props are destructured on the first line of the function body, not in the signature: `const { disabled = false } = props`
- **Blank line between destructuring and the rest of the function body**
- Defaults are set in the destructuring assignment
- `...restProps` is spread onto the root element when the component wraps a native or base element — and is spread FIRST, then explicit overrides come after
- Each public component is a top-level file in `components/` (e.g. `components/button.tsx`)
- Internal sub-components live in a folder matching the public file (e.g. `components/button/text.tsx`)
- Each `.tsx` component has its own `.module.css` file directly next to it — never import CSS from a parent component
- The top-level file IS the public surface — no `index.ts` boilerplate

### Box primitive (the root element)

**Always render `Box` for every HTML element in a component.** Not just the root — every `<div>`, `<h1>`, `<p>`, `<span>`, `<button>`, etc. becomes `<Box as="...">`. The only HTML tag allowed raw in component code is `<svg>` (see the SVG exception below). `Box` lives at `components/box.tsx` and handles `className` merging, `ref` composition, `style` merging, and `data-*` boolean normalization for free.

**Why every element, not just root:** consistency. The moment you mix `<Box>` and raw `<h1>` in the same component, two patterns coexist. Future contributors won't know whether to use raw HTML for "simple" elements or always Box. Always Box is the only readable rule.

### Conditional rendering

**TOTALLY FORBIDDEN: explicitly comparing against `undefined`, `''`, `null`, or `0` for conditional rendering.** Use the truthy short-circuit `&&`. JavaScript's falsy semantics already cover all empty/missing states. Writing `value !== undefined && value !== ''` signals over-thinking and bloats the JSX.

```tsx
// ✓ Right
{description && <Box as="p" className={styles.Description}>{description}</Box>}

{items.length > 0 && <Box as="ul">{items.map(...)}</Box>}

{user?.name && <Box>{user.name}</Box>}

// ✗ Wrong — verbose, signals over-thinking
{description !== undefined && description !== '' ? (
  <Box as="p">{description}</Box>
) : null}

{items.length !== 0 && items.length !== undefined && <Box>...</Box>}

// ✗ Also wrong — ternary with null branch when && works
{condition ? <Box>...</Box> : null}
```

The only time a ternary is justified: rendering **different content** based on the condition (`condition ? <A/> : <B/>`). For "render or don't render", `&&` is the rule.

```tsx
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './button.module.css';

export interface ButtonProps extends BoxProps<'button'> {
  isDisabled?: boolean;
  isPressed?: boolean;
}

export function Button(props: ButtonProps) {
  const { className, isDisabled, isPressed, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="button"
      className={[styles.Button, className]}
      data-disabled={isDisabled}
      data-pressed={isPressed}
      disabled={isDisabled}
    />
  );
}
```

**Rules:**

- **Props ALWAYS extend `BoxProps<T>` where `T` is the root element.** Never write a standalone props interface. Extending pulls in all native attributes plus Box's enhanced `className`/`ref`/`style`.
- **`<div>` is the default — drop the redundancy.** Write `extends BoxProps` (not `BoxProps<'div'>`) and omit `as="div"` on the Box.
- **Other roots are explicit.** `BoxProps<'button'>` + `as="button"`, `BoxProps<'a'>` + `as="a"`, etc.
- **`className` is ALWAYS forwarded.** Any component that styles itself MUST destructure consumer `className` and pass it along: `className={[styles.Button, className]}`. Never write `className={styles.Button}` alone — that drops anything the consumer passed. Box flattens and joins falsy-safe. Never use `cn()`, `clsx`, template strings, or ternaries to merge.
- **`data-*` attributes pass through directly.** Box normalizes booleans → empty string / undefined. Write `data-pressed={isPressed}`, never `data-pressed={isPressed || undefined}`.
- **Spread `...restProps` FIRST on `Box`, then explicit overrides.** That way explicit props (className, data-*, as) always win over what the consumer passed.
- **Pass control props through to the native attribute too.** `isDisabled` → both `data-disabled={isDisabled}` (for CSS styling) AND `disabled={isDisabled}` (for native behavior).
- **Don't destructure `children` if you don't transform them.** `children` is already on `BoxProps<T>` and flows through `...restProps`. Self-close `<Box />` instead of `<Box>{children}</Box>`. Only destructure `children` when you wrap, transform, or render them alongside other content.
- **SVG is exempt from Box.** SVG components render raw `<svg>` with `SVGProps<SVGSVGElement>` and spread `{...props}` directly. The Box abstraction (className arrays, data-attr normalization) doesn't add value for static SVG icons, and `<svg>` has its own namespace + attribute set that doesn't map cleanly.

### Box for div (default case)

```tsx
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './card.module.css';

export interface CardProps extends BoxProps {
  isElevated?: boolean;
}

export function Card(props: CardProps) {
  const { className, isElevated, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.Card, className]}
      data-elevated={isElevated}
    />
  );
}
```

No `<'div'>`, no `as="div"`, no `children` destructuring, self-closing — defaults all the way down.
- Compound components use plain property assignment in app code — never `Object.assign` or `*Fn` suffix:

  ```tsx
  // ✓ Right — app code (inference)
  export function ActionList(props: ActionListProps) {
    // body
  }

  ActionList.Item = ActionListItem;
  ActionList.Separator = ActionListSeparator;

  // ✗ Wrong — body inside Object.assign, ugly *Fn suffix
  export const ActionList = Object.assign(ActionListFn, { Item: ActionListItem });
  function ActionListFn(props) { ... }
  ```

  - File order: `function` declaration → property assignments at the end
  - TypeScript infers the sub-component types from the assignments — no `declare namespace` needed
  - **Exception for library packages** (`isolatedDeclarations: true`): you must declare the namespace explicitly since inference isn't allowed across the public API:

    ```tsx
    // Required only in packages/* with isolatedDeclarations
    export declare namespace ActionList {
      let Item: typeof ActionListItem;
      let Separator: typeof ActionListSeparator;
    }
    ```

### Render-prop pattern on Base primitives

Base primitives (`*Base` components) expose their `useX` state to consumers in one of two ways depending on whether `children` is **content** or **structure**:

- **Atomic Base primitives** — children are content. The component **must** accept a render prop and call `invoke(children, x.state)`:

  ```tsx
  export type CheckboxBaseProps = Override<
    BoxProps<'label'>,
    UseCheckboxOptions & {
      children?: ReactNode | RenderProp<UseCheckboxReturn['state']>;
    }
  >;

  export function CheckboxBase(props: CheckboxBaseProps): ReactElement {
    const { children, ...restProps } = props;
    const checkbox = useCheckbox({ ... });

    return (
      <Box {...restProps}>
        {invoke(children, checkbox.state)}
      </Box>
    );
  }
  ```

  Atomic = `CheckboxBase`, `RadioBase`, `ButtonBase`, `LinkBase`, `GridBaseRow`, `GridBaseCell`, `ListboxBaseOption`, etc. — anything whose `children` is the visual content of that one element.

- **Container Base primitives** — children are **structure** (sub-components). The component **must not** use a render prop, since `children` is parsed for sub-elements (`Listbox.Option`, `Grid.Body`, `Menu.Item`, ...). State is exposed to descendants via Context instead:

  ```tsx
  export function ListboxBase(props: ListboxBaseProps): ReactElement {
    const items = useListboxItems(props.children);
    const listbox = useListbox(items, { ... });

    return (
      <Box {...listbox.props}>
        <ListboxContext value={listbox.contextValue}>
          {items.map(renderListboxItem)}
        </ListboxContext>
      </Box>
    );
  }
  ```

  Container = `ListboxBase`, `GridBase`, `MenuBase`, `TabsBase`, etc. Descendants reach state via `useListboxContext()` / `useGridContext()` / etc.

The test: ask "are children visual content of this element, or structural sub-components?" Content → render prop. Structure → context.

The render-prop function receives `state` typed as `UseXReturn['state']` (or a re-exported alias like `CheckboxBaseState`). Always type the alias and re-export it, so consumers can write strongly-typed render functions.

### Exports

- `index.ts` re-exports values and types separately: `export { Button }` + `export type { ButtonProps }`

### Props

- Never pass data as a separate prop when it is already accessible from another prop. If a component receives `param` and needs `param.name`, read it from `param.name` inside the component — do not add a `name` prop.
- Pass domain data (e.g. `enums`, `types`) as-is through the component tree. Derive computed values at the point of use, not at intermediate layers.
- **Domain components take the full domain object, not exploded fields.** A component representing a domain concept (`Article`, `ReferenceSymbol`, `ClientCard`, `Hero`) takes one prop with the whole object — `<Article article={article} />`, `<ClientCard client={client} />` — and reads its sub-fields internally. The component is the single owner of *how* its fields are rendered. The call site never spreads fields one by one.

  ```tsx
  // ✓ Right — domain component, full object
  <Article article={article} />
  <ClientCard client={client} />

  // ✗ Wrong — exploded fields at call site
  <Article description={article.description} title={article.title} tree={article.tree} />
  <ClientCard name={client.name} email={client.email} status={client.status} />
  ```

  The **exception** is **dumb reusable primitives** — `Box`, `Button`, `Badge`, `Link`, `Input`, etc. They take individual props because they have no domain knowledge. They're styling/behavior wrappers, not domain renderers.

  ```tsx
  // ✓ Right — primitive, individual props
  <Button intent="primary" size="md">Save</Button>
  <Badge variant="success">Active</Badge>
  ```

  Internal compound parts (`Article.Header`, `Article.Body`) are still defined as sub-components for code organization, but the **default API is the outer component taking the full object** — consumers don't compose sub-parts manually unless they need to deviate. The outer component renders the standard arrangement of sub-parts using the domain object's fields.
- `data-*` attributes use lowercase kebab-case: `data-animating`, `data-hide-indicator` — never camelCase (`data-isAnimating`)
- `data-*` attributes never use `is`/`has` prefix: `data-active`, `data-disabled` — never `data-is-active`
- Never pass `|| undefined` to `data-*` attributes — `Box` handles falsy values automatically
- **TOTALLY FORBIDDEN: passing direct CSS values via inline `style`.** Never `style={{ height: '42px' }}`, never `style={{ transform: 'translate(10px, 20px)' }}`, never `style={{ color: 'red' }}`. Inline `style` is **only** for setting CSS custom properties that the stylesheet then consumes via `var()`. The actual styling rules live in `.module.css`.

  ```tsx
  // ✗ Wrong — direct values in style
  <Box style={{ height: `${size}px`, width: `${size}px` }} />

  // ✓ Right — custom properties, CSS reads them
  <Box style={{ '--button-size': `${size}px` }} />
  ```

  ```css
  .Button {
    width: var(--button-size);
    height: var(--button-size);
  }
  ```

- **CSS custom properties are always set on the component's root element**, even if consumed by descendants via CSS `var()`. CSS variables cascade — set them once at the top, children read them anywhere in the subtree.

  ```tsx
  // ✗ Wrong — set on child that consumes it
  <Box className={styles.Navigation}>
    <Box className={styles.Indicator} style={{ '--indicator-x': `${x}px` }} />
  </Box>

  // ✓ Right — set on root, child consumes via cascade
  <Box
    className={styles.Navigation}
    style={{ '--navigation-indicator-x': `${x}px` }}
  >
    <Box className={styles.Indicator} />
  </Box>
  ```

- **CSS variable names always start with the kebab-cased component name** — the same name as the exported symbol and the CSS class (which follow the immediate-parent + filename rule). No exceptions, including for variables that are only consumed inside the same `.module.css`.

  | Path | Component | CSS class | CSS variable |
  | --- | --- | --- | --- |
  | `button.tsx` | `Button` | `.Button` | `--button-x` |
  | `button/atom/text.tsx` | `ButtonAtomText` | `.ButtonAtomText` | `--button-atom-text-x` |
  | `navigation.tsx` (with indicator child) | `Navigation` | `.Navigation` + `.Indicator` | `--navigation-indicator-x` (named after the *owning* component, not the child class) |

  Why: every variable's owner is searchable. `--button-atom-text-size` belongs to `ButtonAtomText`, no guesswork. Unprefixed names like `--size` or `--fill-color` collide globally across components and are forbidden.

- **Cross-component CSS variables** (custom properties read by one component and set by another) follow the same rule: prefix with the **reading** component's full name. The reader defines the contract; the setter conforms to it. Example: `SelectionIndicator` reads `--selection-indicator-fill-color`; consumers like `BodyRow` set that exact name to override.
- **Avoid passing `className` to styled components** (`Button`, `Badge`, `Link`, etc.). Use variants (`size`, `appearance`, `intent`) to customize. If no variant fits — add one to the component, or use the Base primitive (`ButtonBase`, `LinkBase`) for full control. `className` on styled components is a code smell — it means the component API is incomplete
- **Never pass explicit generic type arguments in JSX** — no `<Box<'input'>>`, `<List<User>>`, etc. The generic is inferred from `as=` or other props. If inference fails, the component's type definition is wrong — fix it there, not at the call site.

### Hooks

- One hook per file: `useControllableState.ts`
- Options/return types exported as `Use[Name]Options` and `Use[Name]Return`

### Naming

- Always use **singular resource** in component names: `ClientTable`, `EmployeeCard` — never `ClientsTable`
- Domain components are named `[Resource][Element]`: `ClientTable`, `EmployeeCard`, `AccountNavigation`
- No "Page" components — the route `Component` function handles page layout directly
- **Dispatcher components:** When a "base" component renders a different sub-component based on a type/variant (discriminated union), name the variants `[Parent][Variant]` — not `[Parent][Element]`. Example: `ActivityItem` dispatches to `ActivityItemComment` and `ActivityItemEvent` based on `activitableType`
- **Renderer-dispatcher pattern:** When a `*Renderer` iterator (e.g. `BlockRenderer`) dispatches each element via a recursive sub-component, the dispatcher file is `node.tsx` placed under the renderer's folder, and variants live in a `node/` sub-folder — one file per `type` discriminant. Names follow the standard rule (immediate-parent + filename), which here means the dispatcher exports `[ParentRenderer]Node` and variants export `Node[Variant]`. Example:

  ```
  components/
    block-renderer.tsx                       → BlockRenderer
    block-renderer/
      node.tsx                               → BlockRendererNode (dispatcher: switch block.type)
      node/
        heading.tsx                          → NodeHeading
        paragraph.tsx                        → NodeParagraph
        code-block.tsx                       → NodeCodeBlock
        ...
  ```

  Each variant takes `block: SomeBlock` (the narrowed shape from the discriminated union), renders its root element, and recurses into `block.children` by mapping `<[ParentRenderer]Node block={child} />` (the dispatcher, imported from `../node`). The dispatcher's `switch` has no default — TS exhaustivity check enforces that new block types get handled.

### Layout vs domain name

Pick the suffix based on what the component's top-level navigation chrome lets the user switch between:

| Chrome switches between                                          | Suffix                            |
| ---------------------------------------------------------------- | --------------------------------- |
| Different **instances** (master-detail list)                     | `*Layout`                         |
| Different **peer domains** (Clients vs Employees vs Billing)     | `*Layout`                         |
| Different **aspects of one instance** (Översikt vs Platser tabs) | domain name (`*Detail`, `*Card`, `*Summary`, ...) |

The pattern across nesting depth: **list-shell = Layout, instance-shell = Detail**, regardless of how deep the route tree goes.

```
ClientLayout              (list of clients, master-detail shell)
  └─ ClientDetail         (one client, tabs for facets)
       └─ ClientRateLayout    (that client's rates list — if we build it)
            └─ ClientRateDetail   (one specific rate)
```

#### The peer-vs-aspect test (for workspace shells)

When a component is bound to one `$id` but its children navigate between sub-sections (like `AccountLayout` with Clients / Employees / Billing), ask: **could these children logically exist as peer domains, or are they aspects/sub-collections of the parent?**

- **Peers** — each is a separate concern that could stand alone → `*Layout`
  (Clients and Employees are both top-level resources within an account.)
- **Aspects** — these only make sense as views *of* the parent → domain name
  (Sites and Rates only exist as collections *belonging to* a client.)

This test is not fully deterministic — domain judgment fills in the last 5%. For the 95% the answer is clear.

Never use REST verbs in component names (`*ShowLayout`, `*IndexLayout`) — they describe routes, not components.

### No Abbreviations

Never abbreviate variable, parameter, or block parameter names. Use the full domain name:

```tsx
// Bad
comments.map((c) => c.actorId);
events.map((e) => e.actorId);
const emp = employees.find((emp) => emp.userId === id);

// Good
comments.map((comment) => comment.actorId);
events.map((event) => event.actorId);
const employee = employees.find((employee) => employee.userId === id);
```

**Exception: sort comparators use `(a, b)`.** The two-argument compare callback for `Array.prototype.sort` is a well-known idiom — `a` and `b` are the canonical parameter names in this specific context. Don't rename them to `left/right` or domain terms.

```tsx
// Good
items.sort((a, b) => a.order - b.order);
collected.sort((a, b) => a.name.localeCompare(b.name));
```

### Component Architecture

- **Domain components** (tables, forms, cards) live in `src/components/`, take props, and do one thing.
- Components **never** use `useLoaderData()` or `getRouteApi()`. All data comes through props.
- Types for props come from `@skiftle/api`.
- The route file's `Component` function is the page — it calls `useLoaderData()`, composes domain components, and adds page-level markup (headings, layout).

```tsx
// Good — route file IS the page, composes domain components
export const Route = createFileRoute('/_main/accounts/$accountId/clients')({
  component: Component,
  async loader({ context, params }) {
    const { clients } = await context.api.accounts.clients.index({
      accountId: params.accountId,
    });
    return { clients };
  },
});

function Component() {
  const { clients } = Route.useLoaderData();
  return (
    <div className="px-6 py-10">
      <h1 className="mb-6 text-xl font-semibold text-neutral-900">Kunder</h1>
      <ClientTable clients={clients} />
    </div>
  );
}
```

### Data & Loaders

- Loaders return an object — always use explicit `return`, never implicit arrow shorthand
- Always destructure API responses inline — never assign to intermediate variables:

```tsx
// Good
const { client } = await context.api.accounts.clients.show({ ... });
const [{ comments }, { events }] = await Promise.all([...]);

// Bad
const result = await context.api.accounts.clients.show({ ... });
const [commentsResult, eventsResult] = await Promise.all([...]);
```

- Loaders pass API data straight through — never transform, aggregate, or reshape data in the loader. All derivation and aggregation happens in `Component` or in domain components. This ensures API types from `@skiftle/api` flow unchanged through the component tree.

```tsx
// Good — pass API arrays directly
return { shiftAssignments, shifts, employees };

// Bad — transforming in loader breaks API types
const map: Record<string, string[]> = {};
for (const a of shiftAssignments) { ... }
return { shiftAssignments: map };
```

- Always work with arrays (`T[]`), never transform API arrays into `Record`/`Map` lookups. Use `filterBy`, `findBy`, `indexBy` from `@skiftle/core/array` for lookups at the point of use.
- `useLoaderData()` is called ONLY in the route file's `Component` function, never in domain components
- Find functions (e.g. `findAction`, `findType`) throw internally — loaders never catch
- Use discriminated union narrowing instead of type casts (`as any`, `as SomeType`)
- Loader data is always defined — no `| undefined` guards needed
- Route component functions match TanStack config keys: `component: Component`, `errorComponent: ErrorComponent`, `pendingComponent: PendingComponent`
- When a variable name conflicts with a reserved word, use `_` prefix: `_enum`. Only where the plain name is actually invalid (`type` is fine as a variable).
- Derived values belong in the component that uses them, not in the route or loader.

### Routes

- Route files (`src/routes/`) contain the Route definition (loader + `Component` function).
- `Component` is the page — it composes domain components from `src/components/`.
- No "Page" wrapper components — the route `Component` owns the page layout.
- Route config callbacks use shorthand method syntax: `async loader({ context }) {`, not `loader: async ({ context }) => {`
- In route files, always use route-scoped hooks (`Route.useNavigate()`, `Route.useParams()`, `Route.useSearch()`, `Route.useLoaderData()`, `Route.useRouteContext()`) — never their top-level equivalents from `@tanstack/react-router`
- Route config option order:
  1. `validateSearch`, `search`
  2. `loaderDeps`, `beforeLoad`, `loader`
  3. `shouldRevalidateLoader`, `gcTime`
  4. `onEnter`, `onStay`, `onLeave`, `onCatch`
  5. `head`, `meta`, `scripts`, `headers`
  6. `pendingMs`, `pendingMinMs`, `wrapInSuspense`
  7. `component`, `pendingComponent`, `errorComponent`, `notFoundComponent`

### Server Functions

- **Every route has exactly one `loadData` server function**, declared inline in the route file (`createServerFn().inputValidator(...).handler(...)`). Never extracted to `#lib/*`, never in another file. The router `loader` calls `loadData({ data: input })` and handles the discriminated result (throw `notFound()`, throw `redirect(...)`, or return data). No other logic in the loader.
- **`loadData` body delegates to server-only helpers via static imports from `.server.ts` files.** Pattern:

  ```tsx
  // routes/guide.$.tsx
  import { loadGuideArticle } from './guide.$.server';

  const loadData = createServerFn()
    .inputValidator((slug: string) => slug)
    .handler(({ data: slug }) => loadGuideArticle(slug));
  ```

  Pass-through is fine when the helper does all the work. Inline more logic only if it's tiny route-glue.

- **No dynamic `await import(...)` inside handlers.** The old `await import('node:fs/promises')` / `await import('#lib/...')` pattern is replaced by static imports from `.server.ts` files — TanStack Start's `.server.ts` suffix tree-shakes the file from the client bundle, so static imports are safe and cleaner.
- **GET is default** for `createServerFn()` — never specify `{ method: 'GET' }`. Mutations use `createServerFn({ method: 'POST' })`.
- Mutations: verb + resource — `createComment`, `destroyComment`, `batchCreateShiftAssignments`.
- All server functions use `authenticated` middleware (where backend exists).

### Server-only helpers (`.server.ts`)

TanStack Start's `.server.ts` suffix marks a file as server-only — it never bundles to the client.

- **Route-specific server helpers** live next to the route file: `routes/guide.$.server.ts` is the companion to `routes/guide.$.tsx`.
- **Cross-route shared server helpers** live in `lib/*.server.ts` or `docs/*.server.ts` depending on domain.
- **Function names inside `.server.ts`** are plain action verbs that describe what they do — `loadGuideArticle`, `parseMarkdoc`, `loadManifest`, `extractApi`. No prefix or suffix to mark them as server-only; the file extension already signals it.
- **Types that are shared between client and server live in a non-`.server.ts` file** (`lib/markdoc.ts` for types, `lib/markdoc.server.ts` for functions that use them). Client components import types via `import type { ... }` from the type file. If types must stay in a `.server.ts` (rare), client imports them via `import type` only — the type-only import is erased at build time so no runtime code leaks.
- **Server helpers return plain data (discriminated unions, primitives, arrays)** — never class instances. Server-fn serialization (seroval) only handles JSON-compatible shapes.

### Search Params

Search params use **namespaced objects** that match the API contract 1:1 (`page`, `sort`, `filter`). Each route owns a namespace; parent routes retain child namespaces via middleware.

**Principles:**

1. **API-shaped params.** `page[number]=1&page[size]=25`, `sort[createdAt]=desc` — no mapping layer between URL and API.
2. **`retainSearchParams` for parent-owned params only.** Parent routes use `retainSearchParams` to keep their own params (e.g. `page`) through child navigations. Never use it to retain child namespaces — that creates context-leak bugs.
3. **`stripSearchParams` for defaults.** Every route strips its own defaults so the URL stays clean.
4. **Links control scope explicitly.** The `search` prop determines what survives navigation. Same-context links preserve with `(prev) => prev`. Context-change links pass only parent params.

**Route middleware pattern:**

```tsx
// Parent list route — retains filter params (page always resets to 1)
retainSearchParams(['status']);

// Child routes — only strip their own defaults
stripSearchParams(DEFAULTS);
```

**Navigation rules:**

| Navigation                               | `search` prop                             | Effect                                                   |
| ---------------------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| Within same route (paginate, sort)       | `(prev) => ({ ...prev, rates: { ... } })` | Update own namespace                                     |
| Same context, sibling route (tab switch) | Strip `page` from all levels via helper   | Preserve non-default sibling state, reset all pagination |
| New context (different entity)           | `(prev) => ({ status: prev.status })`     | Keep parent filter, reset page and children              |

**Tab active state:** Use `pending: true` in `matchRoute` to prevent flash during loading:

```tsx
matchRoute({ to: '...', fuzzy: true }) ||
  matchRoute({ to: '...', fuzzy: true, pending: true });
```

### Mutations & Side Effects

- `router.invalidate()` must always be called with `{ sync: true }`: `await router.invalidate({ sync: true })`
- `toastQueue.add()` must always come **after** all async operations (API calls, invalidation) have completed — never before or in parallel with them

```tsx
// Good — toast after all async work
async function handleArchive() {
  await api.accounts.clients.archive({ accountId, id });
  await router.invalidate({ sync: true });
  toastQueue.add({ title: 'Arkiverad', variant: 'success' }, { timeout: 3000 });
}

// Bad — toast before invalidation completes
async function handleArchive() {
  await api.accounts.clients.archive({ accountId, id });
  toastQueue.add({ title: 'Arkiverad', variant: 'success' }, { timeout: 3000 });
  await router.invalidate();
}
```

### State

- Never use `useCallback` — define functions directly in the component body.
- Boolean state variables must use `is` or `has` prefix: `const [isOpen, setIsOpen] = useState(false)`, `const [hasError, setHasError] = useState(false)` — never `const [open, setOpen]` or `const [loading, setLoading]`.
- Refs must not be written to during render — use `useEffect` to update refs.
- Inside `useEffect`/`useLayoutEffect` callbacks, always use arrow functions — never `function` declarations: `const update = () => { ... }` not `function update() { ... }`
- Refs split in two by what they hold:
  - **DOM element refs** — root is always named `element`: `const element = useRef<HTMLDivElement>(null)`. Child element refs are named `[child]Element`: `const linkElement = useRef<HTMLAnchorElement>(null)`. Never suffix with `Ref` — use `activeElement` not `activeElementRef`.
  - **All other refs** (values, callbacks, timers, flags) — always suffix with `Ref`: `const delayRef = useRef(delay)`, `const onChangeRef = useRef(options.onChange)`, `const timerRef = useRef<number>(undefined)`, `const hasRevealedRef = useRef(false)`.
- The `$`-prefix is **reserved for ref extractions only** — values pulled from `.current` or `toValue(ref)`. It is the visual marker that says "this is the live value of a ref at this moment". Never use `$`-prefix for plain DOM lookups, return values, or any other variable. Examples: `const $element = element.current` ✓, `const $onChange = onChangeRef.current` ✓, `const $sampleElement = container.querySelector(...)` ✗ (no ref involved → no `$`).
- When consuming a ref's `.current` value more than once (or after a null-check), extract into a `$`-prefixed variable. If `.current` is used exactly once inline, leave it inline — the single-use rule wins.
- Extracted ref-variable names mirror the ref names exactly. **DOM element extractions always carry the `Element` suffix** (matching their refs): `const $element = element.current` for the root, `const $triggerElement = triggerElement.current` for a child element. Never strip the suffix at the extraction site (no `$trigger`, no `$attachment`, no `$first`).
- Plain DOM lookups (`document.getElementById`, `element.querySelector`, etc.) are **not** ref extractions, so they get **no `$`-prefix** — but they still carry the `Element` suffix when bound to a variable: `const sampleElement = $element.querySelector(...)`, `const targetElement = document.getElementById(id)`. The `Element` suffix is about what kind of value it is (a DOM node), not where it came from.
- Never extract a variable that is used exactly once. Inline the expression instead. The only exceptions: the name documents non-obvious intent, or the extraction is required by another rule (e.g. null-check before use).
- Values derived from the root element are named after what they return, not what they belong to — the root is implicit context: `const rect = getRect($element)`, not `const containerRect`. Child-derived values are prefixed with the child name: `const activeRect = getRect($activeElement)`, `const targetRect = getRect(targetElement)`.
- Always call `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `requestAnimationFrame`, `cancelAnimationFrame` on `window`: `window.setTimeout(...)`, `window.requestAnimationFrame(...)` — never bare.
- Timeout/interval refs are named `timeoutRef` / `intervalRef` and always typed `useRef<number>(undefined)` — never `useRef<ReturnType<typeof setTimeout>>`. `undefined` (not `null`) is the initial value because `window.clearTimeout` accepts `number | undefined` directly and avoids a null-guard at every call site. When multiple timeouts or intervals coexist in the same scope, prefix with what they control: `hideTimeoutRef`, `resetTimeoutRef`, `pollIntervalRef`.

## Component Naming Algorithm

The goal is **deterministic naming**: given the same UI description, two independent runs produce identical component names. No taste, no judgment beyond a small documented set of edge cases.

The algorithm has four mechanical steps. Each step uses closed vocabularies (Element suffix, Slot suffix) — if a UI piece doesn't fit, **extend the vocabulary in this file FIRST**, then code. Never invent names ad-hoc.

### Step 1: Component or inline?

A JSX block becomes a component **if and only if at least one trigger fires**. Size/length is **not** a trigger — never extract just because something is long.

```
☐ T1  Wraps <Outlet />
☐ T2  Rendered at 2+ call sites
☐ T3  Owns a defineTranslation
☐ T4  Owns hardcoded route links (to="...")
☐ T5  Owns its own hooks (useState, useEffect, useMutation, useDebouncedCallback, ...)
☐ T6  Branches on a domain enum (switch/if on a domain value)
☐ T7  Is a structural sub-region of a Layout or Detail (compound slot)
```

No triggers fire → **inline** in the route or parent component.

### Step 2: Classify

| Condition                                   | Classification     |
| ------------------------------------------- | ------------------ |
| T1 fires + master-detail / workspace shell  | LAYOUT             |
| T1 fires + instance shell                   | DETAIL             |
| T7 fires (structural slot, no domain logic) | COMPOUND SLOT      |
| Otherwise (any other trigger fired)         | DOMAIN COMPONENT   |

(For LAYOUT vs DETAIL details, see the *Layout vs domain name* section above.)

### Step 3: Pick suffix from a closed vocabulary

#### Element vocabulary (for DOMAIN COMPONENTS)

```
ROUTE SHELLS (wrap <Outlet />)
  Layout              — list-shell or workspace shell
  Detail              — instance shell

INSTANCE VIEWS (one specific resource, no collection)
  Summary             — <dl> of fields (read-only)
  Card                — bordered preview block
  Form                — input form (create/edit)

COLLECTION VIEWS (list/group of instances)
  Table               — <table>
  BrowseList          — <ul> of navigation links (one per instance)
  PickList            — <ul> of selectable rows (multi-select)
  List                — generic <ul>
  Row                 — single row (usually internal)

CHROME (action/navigation strips)
  Navigation          — set of route-links (tabs, side-nav)
  BulkActionsBar      — actions on multi-selection
  BrowseActionsBar    — actions in browse-mode (filter + edit toggle)
  ActionsBar          — generic actions strip

ATOMIC
  Badge               — status pill
  SearchInput         — wrapped search input
  Input               — wrapped generic input
  EmptyMessage        — empty state
  Avatar              — profile picture
```

#### Slot vocabulary (for COMPOUND SLOTS)

```
TOP-LEVEL Layout/Detail SLOTS
  Header              — top region (title, actions)
  Bar                 — generic horizontal slot below Header (tabs, filter, banner)
  Content             — main area (often holds the Outlet or domain content)
  Footer              — bottom region (pagination, sticky save)
  Sidebar             — side region (list, navigation)
  Main                — only at the outermost page layout where <main> is not yet used

SIDEBAR SUB-SLOTS (when Sidebar is itself compound)
  Header              — search/filter
  Content             — scroll area
  Footer              — pagination

HEADER SUB-SLOTS
  Title               — title cluster (h1 + optional badge)
  Bar                 — primary horizontal bar (wordmark + actions)
  Drawer              — expandable section that toggles open (mobile menu)
```

### Step 4: Compose the name

- **Standalone domain component:** `[Resource][Element]`
  - Resource = singular domain noun matching the API resource (`Client`, `Employee`, `Account`, `Rate`).
  - Examples: `ClientSummary`, `ClientPickList`, `ClientBulkActionsBar`.
- **Compound slot:** `[Parent][Slot]`, accessed via dot notation.
  - Examples: `ClientDetail.Header`, `ClientLayout.Sidebar.Content`.
- **Layout/Detail:** `[Resource][Layout|Detail]`.
  - Examples: `ClientLayout`, `ClientDetail`, `AccountLayout`.

### Compound slot vs standalone — the test

A sub-component is `Parent.Slot` (compound) **if and only if it is a pure layout shell**:

- No `defineTranslation`
- No hardcoded `to=` route links
- No hooks
- No domain switch/if
- No domain data as prop (`client`, `employee`, ...)

If **any** of these are present → it's a standalone `ParentName` component (own folder).

### Vocabulary extension rule

If a UI piece doesn't match any Element or Slot in the vocabulary above, **stop**. Add the new entry to this file with a clear definition, then proceed. Never coin a suffix at the call site.

### Verification

Self-check: pick any extracted component in the codebase and run the algorithm on its description. The same name should fall out. If it doesn't, either the rules are wrong (escalate) or the component was named ad-hoc (rename).

### Where determinism still bends (~2% of cases)

- **Layout vs Detail boundary** — peer-vs-aspect for workspace shells. Documented above; needs domain judgment in rare cases.
- **Vocabulary gaps** — a genuinely new UI shape may need vocabulary extension. The rule keeps this controlled (extend first, code second).

Everything else is mechanical.

## Internationalization

All user-facing strings use `@skiftle/intl` via the app's `src/lib/intl.ts` config.

### App config

The app defines its locales once in `src/lib/intl.ts`. All components import from this file, never from `@skiftle/intl` directly:

```tsx
import { defineTranslation, useTranslation } from '../lib/intl';
```

### Translation placement

Translations live in the **same file** as the component, **below** the component function. The variable is always named `translation`:

```tsx
import { defineTranslation, useTranslation } from '../lib/intl';

export function ClientDetail(props: ClientDetailProps) {
  const { client } = props;
  const t = useTranslation(translation);

  return <dt>{t('type')}</dt>;
}

const translation = defineTranslation({
  en: { type: 'Type' },
  sv: { type: 'Typ' },
});
```

### Rules

- The `defineTranslation` variable is always named `translation`
- `translation` is placed **after** the component — component code comes first
- `useTranslation(translation)` is called at the top of the component body
- All locales defined in the app config are **required** — missing a locale is a TS error
- For server functions (outside React), use `createTranslator(translation, 'sv')` instead
- Shared translations (used by multiple components) live in a dedicated file and are imported

### Translation key conventions

Keys are **flat camelCase** strings following the pattern `{subject}{Component}{Prop}`:

- **subject** — what the element is about (domain name, action, etc.)
- **Component** — the UI component name (`Button`, `NumberField`, `DateField`, `Dialog`, etc.)
- **Prop** — the prop being translated (`Label`, `Content`, `Title`, `Message`, etc.)

Use `Content` for visible text (children). Use `Label` for `aria-label` (e.g. icon-only buttons).

```tsx
const translation = defineTranslation({
  en: {
    cancelButtonContent: 'Cancel',
    effectiveFromDateFieldLabel: 'From',
    hourlyRateCentsNumberFieldLabel: 'Hourly rate (cents)',
    removeEndDateButtonLabel: 'Remove end date',
    submitButtonContent: 'Save',
  },
  sv: {
    cancelButtonContent: 'Avbryt',
    effectiveFromDateFieldLabel: 'Från',
    hourlyRateCentsNumberFieldLabel: 'Timpris (öre)',
    removeEndDateButtonLabel: 'Ta bort slutdatum',
    submitButtonContent: 'Spara',
  },
});

t('hourlyRateCentsNumberFieldLabel');
t('submitButtonContent');
```

### Translation key conventions for mutations

Every mutation uses **nested objects** for confirm dialogs and toasts. The branch name under each top-level namespace **matches the mutation variable name without the `Mutation` suffix** — see Mutations below.

| Top-level namespace | Sub-keys                       | Used by                            |
| ------------------- | ------------------------------ | ---------------------------------- |
| `confirm`           | `title`, `message`             | `confirm({ title, message, ... })` |
| `toast`             | `success.title`, `error.title` | success/error toasts               |

For a mutation `deleteRateMutation`, the keys are:

```
confirm.deleteRate.title
confirm.deleteRate.message
toast.deleteRate.success.title
toast.deleteRate.error.title
```

For a bulk variant `bulkDeleteRateMutation`:

```
confirm.bulkDeleteRate.title
confirm.bulkDeleteRate.message
toast.bulkDeleteRate.success.title
toast.bulkDeleteRate.error.title
```

Only include the keys a mutation actually uses. A mutation without a confirm step has no `confirm.*` keys; a quick edit without a toast has no `toast.*` keys.

## Mutations

All API mutations (POST, PUT, PATCH, DELETE) use the `useMutation` hook from `#hooks/useMutation`. The hook handles `isPending`, surfaces success/error to callbacks, and globally redirects to `/logout` on 401.

### Placement

**Mutations always live in the route's `Component` function — never in domain components.** No exceptions.

Domain components stay "dumb": they take callbacks as props (`onArchive`, `onDelete`, `onSubmit`) and invoke them on user interaction. The route owns `useMutation`, `useConfirm`, and `useToast`, defines `handleX` functions, and passes them into the components that trigger them.

This keeps domain components reusable and free of side effects, and makes the route the single source of truth for everything that happens on user action — data fetching, mutations, navigation, toasts.

```tsx
// Good — route owns the mutation, component is dumb
function Component() {
  const deleteClientMutation = useMutation(...);

  function handleDelete(client: Client) {
    confirm({ ..., onOk: () => deleteClientMutation.mutate(client) });
  }

  return <ClientTable clients={clients} onDelete={handleDelete} />;
}

// Bad — mutation inside the domain component
export function ClientTable(props: ClientTableProps) {
  const deleteClientMutation = useMutation(...); // ✗ never
  // ...
}
```

### Hook signature

```ts
useMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  options?: {
    onSuccess?: (result: TResult, input: TInput) => Promise<void> | void;
    onError?: (error: unknown, input: TInput) => Promise<void> | void;
  },
): { mutate: (input: TInput) => Promise<void>; isPending: boolean }
```

`isPending` stays `true` until both `mutationFn` AND any `onSuccess`/`onError` callback have resolved. UI loading states are correct without extra coordination.

### Naming convention

- **Always suffix with `Mutation`**: `deleteRateMutation`, not `deleteRate`
- **Always include the resource**, even if the route context implies it: `deleteRateMutation`, not `deleteMutation`
- **Format:** `<verb><Resource>Mutation`
- **Bulk variants:** `bulk` prefix → `bulkDeleteRateMutation`
- **One mutation per use:** never reuse a mutation hook for two different actions

```ts
const deleteRateMutation = useMutation(...);
const createRateMutation = useMutation(...);
const bulkDeleteRateMutation = useMutation(...);
const archiveClientMutation = useMutation(...);
const publishShiftMutation = useMutation(...);
```

### Standard mutation pattern

`onSuccess` invalidates the router and shows a success toast. `onError` shows an error toast. The hook handles 401 internally — never check for it in `onError`.

```tsx
const deleteRateMutation = useMutation(
  (rate: Rate) =>
    api.accounts.rates.destroy({ accountId, id: rate.id }),
  {
    async onSuccess() {
      await router.invalidate({ sync: true });
      toast(
        { title: t('toast.deleteRate.success.title'), variant: 'success' },
        { timeout: 3000 },
      );
    },
    onError() {
      toast(
        { title: t('toast.deleteRate.error.title'), variant: 'error' },
        { timeout: 5000 },
      );
    },
  },
);
```

### Confirmation for destructive and critical actions

Destructive (delete, destroy) and critical (archive, deactivate, publish) mutations are wrapped in a `confirm({ ... })` call inside a thin `handleX` function. The mutation runs in the `onOk` callback. `useConfirm`'s `isBusy` automatically tracks the `onOk` promise and shows loading on the OK button.

- **Destructive (delete, destroy):** `confirm({ danger: true, ... })`
- **Critical but reversible (archive, deactivate, unpublish):** `confirm({ ... })` without `danger`
- **Routine edits (update, save form):** no confirm — call `mutation.mutate()` directly

```tsx
function handleRateTableDelete(rate: Rate) {
  confirm({
    danger: true,
    title: t('confirm.deleteRate.title'),
    message: t('confirm.deleteRate.message'),
    onOk: () => deleteRateMutation.mutate(rate),
  });
}
```

For bulk variants, the confirm message uses interpolation:

```tsx
function handleRateTableBulkDelete(rates: Rate[]) {
  confirm({
    danger: true,
    title: t('confirm.bulkDeleteRate.title'),
    message: t('confirm.bulkDeleteRate.message', { count: String(rates.length) }),
    onOk: () => bulkDeleteRateMutation.mutate(rates),
  });
}
```

### Validation errors (sorbus `catch`)

For mutations that may return validation errors (e.g. 422 on form submit), opt into sorbus's `catch` option in the `mutationFn`. The endpoint then resolves with a discriminated `Result` instead of throwing, and `onSuccess` branches on `result.ok`:

```tsx
const createRateMutation = useMutation(
  (input: CreateRateInput) =>
    api.accounts.rates.create(
      { accountId, rate: input },
      { catch: [422] },
    ),
  {
    async onSuccess(result) {
      if (!result.ok) {
        setFieldErrors(result.data.issues);
        return;
      }
      await router.invalidate({ sync: true });
      toast(
        { title: t('toast.createRate.success.title'), variant: 'success' },
        { timeout: 3000 },
      );
    },
    onError() {
      toast(
        { title: t('toast.createRate.error.title'), variant: 'error' },
        { timeout: 5000 },
      );
    },
  },
);
```

Use this pattern for forms; use plain throw-based mutations for destructive actions where 422 is not expected.

## Forms

All input forms (create/edit) use the same pattern. **There is no other way.** Look at `RateForm` + `RateFormDialog` (dialog-based) and `ClientForm` (page-based) as canonical references.

### State ownership — always in the route

The route's `Component` function owns three pieces of state:

```tsx
// 1. Draft — persistent in-progress edit
const draft = useDraft(
  `client-update:${clientId}`,                       // create: 'client-create'
  build(ClientUpdatePayloadSchema, client),          // create: build(SchemaCreate, defaults)
);

// 2. Mutation — opt into 422 catching for validation
const updateClientMutation = useMutation(
  (payload: ClientUpdatePayload) =>
    api.accounts.clients.update({ accountId, client: payload, id: clientId }),
  {
    async onSuccess() {
      draft.clear();
      await router.invalidate({ sync: true });
      await navigate({ ... });
      toast({ title: t('toast.updateClient.success.title'), variant: 'success' }, { timeout: 3000 });
    },
    onError() {
      toast({ title: t('toast.updateClient.error.title'), variant: 'error' }, { timeout: 5000 });
    },
  },
);

// 3. Form — wires draft → form, form → mutation, mutation errors → form
const form = useForm<ClientCreatePayload | ClientUpdatePayload>(draft.value, {
  defaultValues: draft.initialValue,
  onChange: draft.save,
  onReset: draft.clear,
  onSubmit: updateClientMutation.mutate,
  validationErrors: updateClientMutation.validationErrors,
});
```

The `useForm` payload type is **always the union of Create and Update** payloads (`ClientCreatePayload | ClientUpdatePayload`), so the same form component is reusable across both routes.

### Form component — bound via a single `form` prop

The domain form component (e.g. `ClientForm`, `RateForm`) is "dumb" UI:

```tsx
export interface ClientFormProps extends Omit<FormProps, 'form' | 'onSubmit'> {
  form: UseFormReturn<ClientPayload>;
  onCancel: () => void;
  title: string;
}

export function ClientForm(props: ClientFormProps): ReactElement {
  const { form, onCancel, title, ...restProps } = props;
  // ...
  return (
    <Form {...restProps} className={styles.ClientForm} form={form}>
      {/* Header (title + cancel/submit) */}
      <Field field={form.fields.name} label={t('nameTextFieldLabel')}>
        {(props) => <Input {...props} />}
      </Field>
      {/* ... more fields ... */}
    </Form>
  );
}
```

Rules:
- **Always extends `Omit<FormProps, 'form' | 'onSubmit'>`** — so it accepts arbitrary HTML form attributes (id, etc.) but the form binding goes through `form` prop.
- **Wraps content in `<Form form={form}>`** from `#lib/form` — never `@skiftle/form` or the raw `<form>` element.
- **Each field uses `<Field field={form.fields.X}>`** from `#lib/form` — never wires value/errors/onChange manually.
- **Imports `useForm`, `UseFormReturn`, `Field`, `Form` from `#lib/form`** — never from `@skiftle/form` directly.
- **Cancel/submit button labels live inside the form component** as constants (`cancelButtonContent`, `submitButtonContent`) — they're stable per resource.
- **Title is a prop** (varies per route: "New X" vs "Edit X") with interpolation in the route's translation.

### Page-form vs dialog-form

| Form is opened as... | Component shape                                                                                                          | Example                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| Full page route      | `*Form` is the **whole page** (header + actions + fields). If header buttons sit alongside `<Form>`, use `form={formId}` | `ClientForm`                  |
| Dialog               | `*Form` is **just the fields**; `*FormDialog` wraps it. Submit button in `Dialog.Footer` connects via `form={formId}`    | `RateForm` + `RateFormDialog` |

The choice is driven by where the form appears (page route vs dialog), not by taste.

### Submit button placement

The submit button can live **inside or outside** the `<Form>` element — choose based on layout structure:

- **Inside `<Form>`** (default) — when the submit button is a natural child of the form's layout. Standard `type="submit"` works.
- **Outside `<Form>`, connected via `form={formId}`** — only when the chrome forces a sibling structure: a `Dialog.Footer` that wraps the form, or a page header where the submit button sits alongside the form (not inside it). Pass `formId` from `useId()` to both `<Form id={formId}>` and the submit button's `form={formId}` attribute.

The driver is **layout**, not preference. If you can put the submit button inside `<Form>` without breaking the layout, do that — fewer props to wire, no `useId` needed.

### Translation keys

- **Field labels:** `[fieldName][Element]Label` — e.g. `nameTextFieldLabel`, `hourlyRateCentsNumberFieldLabel`, `effectiveFromDateFieldLabel`. Element is the input type.
- **Form-component buttons:** `cancelButtonContent`, `submitButtonContent`, `resetButtonContent`.
- **Route-side titles:** `newTitle`, `editTitle: 'Edit {name}'` — with interpolation.
- **Route-side toasts:** `toast.[verb][Resource].success.title`, `toast.[verb][Resource].error.title`.

### Validation errors

`validationErrors: mutation.validationErrors` flows from the mutation into `useForm`. The `<Form>` and `<Field>` components from `#lib/form` automatically display them. The mutation must opt into sorbus's `catch: [422]` (see *Mutations § Validation errors*).

## Extending component props

Always extend the underlying component's prop type (`BoxProps`, `PickListProps`, `LinkBaseProps`, etc.). **Never re-declare props that are already inherited** — most HTML attributes (`aria-*`, `role`, `id`, `className`, `style`, etc.) live on `BoxProps` already and propagate through every component that extends it.

```ts
// ✗ Don't — re-declaring aria-label which BoxProps already has
type MyComponentProps = Omit<PickListProps, 'aria-label' | 'children'> & {
  'aria-label'?: string;
  // ...
};

// ✓ Do — inherit from the underlying component
type MyComponentProps = Omit<PickListProps, 'children'> & {
  // ...
};
```

If you find yourself wanting to make an inherited prop required at your layer, **don't**. The contract belongs to the leaf component (typically Box/HTML element). Re-declaring is noise.

## Domain vs UI: null vs undefined

Two layers, two conventions. Never mix.

**Domain types use `null` for missing optional values.** Treat parsed/loaded content as if it came from a backend. Stable shape (the field is always present), explicit "intentionally absent" semantics, serializable to JSON. This applies to everything in `lib/content`, route loaders, and any data we'd ever cache or send over a wire.

```ts
// ✓ Domain
interface CalloutBlock {
  type: 'callout';
  title: string | null;     // stable shape, null = author didn't provide
  variant: CalloutVariant;
  children: Block[];
}
```

**UI components use `?:` optional fields.** React-idiomatic, `undefined` for missing. Components are vanilla React building blocks — they don't know about domain conventions, they don't accept `null` in their props.

```ts
// ✓ UI
interface CalloutProps extends BoxProps<'aside'> {
  title?: string;            // optional, undefined when omitted
  variant: CalloutVariant;
}
```

**The conversion lives inline at the dispatcher node** — the boundary between the two layers. Per-prop `?? undefined` translates domain-null to UI-undefined. Don't hide this in adapter functions; the visible `?? undefined` IS the layer-boundary marker.

```tsx
// ✓ Dispatcher node — translation visible at the boundary
<Callout
  title={block.title ?? undefined}
  variant={block.variant}
>
  ...
</Callout>
```

**Display defaults belong in the UI, not in the dispatcher.** If a callout has no title, the Callout component decides what to show (e.g. capitalized variant name). The dispatcher only translates absence; it doesn't invent display values.

## Type modifiers

Never use the TypeScript `readonly` modifier. Not in interfaces, not in array types (`readonly T[]`), not on class properties. If a value comes from outside and shouldn't be mutated, that's enforced by code review and discipline — not by the type system.

```ts
// ✗ Don't
selection: readonly string[];
items: readonly Item[];

// ✓ Do
selection: string[];
items: Item[];
```

## Control Flow

- Never put `if`-then statements on a single line. Always use braces and a newline:

```tsx
// Bad
if (!item) throw new Error('not found');
if (!param) return null;
if (value === 'true') return true;

// Good
if (!item) {
  throw new Error('not found');
}
if (!param) {
  return null;
}
if (value === 'true') {
  return true;
}
```

## Object Formatting

Always expand object literals to one property per line. Never inline multiple properties or nest objects on a single line:

```tsx
// Good
const { client } = await api.accounts.clients.show({
  accountId,
  id: clientId,
});

toastQueue.add(
  {
    title: 'Arkiverad',
    variant: 'success',
  },
  { timeout: 3000 },
);

// Bad
const { client } = await api.accounts.clients.show({ accountId, id: clientId });
toastQueue.add({ title: 'Arkiverad', variant: 'success' }, { timeout: 3000 });
```

Exception: single-property objects used as options may stay inline when they are a well-known pattern: `{ sync: true }`, `{ timeout: 3000 }`, `{ replace: true }`.

## Design tokens — two-tier system

Tokens live in `src/styles/tokens.css` and follow a strict **two-tier architecture**:

### Tier 1 — Palette (`--color-*`)

A small set of raw palette colors, named after their **identity** (what the color IS).

```css
--color-mint:   oklab(0.87 -0.24 0.06);
--color-aqua:   oklab(0.88 -0.21 0.01);
--color-coral:  #ff9aa0;
--color-silver: #e6e6e6;
--color-ink:    #141414;
```

**Components must never reference `--color-*` directly.** The palette only exists to feed tier 2.

### Tier 2 — Semantic (everything else)

What components actually use. Named after **intent** (what the color DOES).

- **Color intent** (`--brand`, `--accent`, `--danger`) — assigns a palette color to a semantic role. Swap these to re-theme.
- **Variants** (`--brand-soft`, `--brand-glow-strong`, `--accent-soft`) — derived from `--brand`/`--accent` via `color-mix(in oklch, var(--brand) X%, transparent)`. NEVER from `--color-*` directly.
- **Surfaces, rings, text** (`--surface`, `--ring`, `--text-soft`) — derived from `--color-silver` or `--color-ink`.
- **Effects** (`--shadow-brand-glow`, `--gradient-brand`, `--shadow-ring-inset`) — composite values, derived from semantic tokens.

### Rules

1. **Components only use tier 2.** Never `var(--color-mint)` in a component CSS — use `var(--brand)`.
2. **Tier 2 variants derive from tier 2 intent**, not from palette. `--brand-soft` mixes from `--brand`, not from `--color-mint`. This keeps the swap chain working: change `--brand` → all `--brand-*` variants follow.
3. **No raw hex/rgba/oklab in component CSS.** If you need a translucent brand color, write `color-mix(in oklch, var(--brand) X%, transparent)` inline. Don't inline `oklab(0.87 -0.24 0.06 / X)`.
4. **Re-theming a swap**: change `--brand: var(--color-aqua)` and the entire site updates without touching components.

## Breakpoints

One layout-shift breakpoint, used uniformly across the codebase:

- **`min-width: 60rem`** (960px) — the threshold where layouts shift from mobile (stacked, 1-col, no decorations) to desktop (multi-col, dividers, hover-only affordances).

**Mobile-first.** Default CSS targets mobile/small screens. `@media (min-width: 60rem)` enhances for desktop. Never use `max-width` queries — they invert the model and lead to harder-to-maintain stylesheets.

```css
/* ✓ mobile-first */
.Component {
  /* default: mobile */
  grid-template-columns: 1fr;

  @media (min-width: 60rem) {
    /* desktop enhancement */
    grid-template-columns: 1fr 1fr;
  }
}

/* ✗ desktop-first — don't */
.Component {
  grid-template-columns: 1fr 1fr;

  @media (max-width: 60rem) {
    grid-template-columns: 1fr;
  }
}
```

If you need a different threshold for a specific component (rare), document why. Generally everything that shifts between mobile and desktop layouts uses 60rem.

## CSS Modules

All styling uses CSS Modules with CSS custom properties from the design token system (`@skiftle/ui/styles`).

### File placement

- **Components** (`packages/ui/`, `apps/*/src/components/`): `ComponentName.module.css` next to `ComponentName.tsx`
- **Routes** (`apps/*/src/routes/`): `route.module.css` next to `route.tsx`

### Import

```tsx
import styles from './route.module.css';
// or
import styles from './Button.module.css';
```

### Class naming

All element classes use **PascalCase**. Every child class is prefixed with its parent's full name. Nesting mirrors the HTML structure:

```css
@layer components {
  .Route {
    display: flex;
    height: 100%;

    .Sidebar {
      display: flex;
      flex-direction: column;
      width: 320px;

      .SidebarHeader {
        padding: var(--spacing-4);

        .SidebarHeaderToolbar {
          display: flex;
          justify-content: space-between;
        }
      }

      .SidebarList {
        flex: 1;
        overflow-y: auto;
      }
    }

    .Content {
      flex: 1;
    }
  }
}
```

- Routes use `.Route` as the root class
- Components use the component name as the root class: `.Button`, `.Dialog`, `.Checkbox`
- Modifiers (rare — prefer data attributes) use camelCase

### Deterministic class-naming algorithm

**The one rule:** every class name ends with an ElementType from the fixed vocabulary below. The only exception is the component root, which is the component name.

No creativity, no judgement, no "semantic" names. Same input always produces the same name.

```
CLASS NAME = [Role]ElementType
             └─optional┘└─required, from fixed vocab─┘
```

#### Fixed ElementType vocabulary

Every class name must end with one of these. Nothing else is valid.

**Group / layout** (element wraps ≥2 children):
- `Row` — flex-direction: row
- `Stack` — flex-direction: column
- `Grid` — display: grid
- `List` — `<ul>` / `<ol>` (semantic list)
- `DescriptionList` — `<dl>` (key/value pairs, e.g. resource summaries)
- `Term` — `<dt>` (label half of a `<dl>` pair)
- `Description` — `<dd>` (value half of a `<dl>` pair)

**HTML5 landmarks** (element IS a landmark region). These come in two **layout trios** — pick one per container, don't mix:

**Vertical trio** (stacked top-to-bottom):
- `Header` — `as="header"`
- `Content` — default `<div>`, or `as="section"` if the region needs a landmark
- `Footer` — `as="footer"`

**Horizontal trio** (side-by-side):
- `Sidebar` — `as="aside"` — used only when there is exactly ONE sidebar
- `Main` / `Content` — the partner of `Sidebar`. **Pick based on whether `<main>` is already used higher in the tree:**
  - **`Main`** — `as="main"` — only at the **outermost page layout** where no `<main>` exists yet. There is **exactly one `<main>` per page**, ever. If a parent route already renders `<main>`, you may NOT use `Main` again.
  - **`Content`** — default `<div>` — when `<main>` is already taken by a parent layout. This is the common case for nested layouts (master-detail inside a `_main` route, etc.).
- `StartBar` / `EndBar` — `as="aside"` — used when there are TWO sidebars (replaces `Sidebar`)

**Other landmarks** (standalone):
- `Nav` — `as="nav"`
- `Section` — `as="section"`
- `Article` — `as="article"`

Each landmark name appears max once per component. `StartBar` and `EndBar` count as separate names.

**Text content:**
- `Heading` — `<Heading>` component (any level)
- `Paragraph` — `<Paragraph>` component / `<p>`
- `Text` — `<Text>` component / `<span>` / plain text in `<Box>`
- `PreformattedText` — `<pre>`
- `Code` — `<code>`
- `Label` — `<Label>` / `<label>`

**Interactive:**
- `Link` — `<Link>` / `<a>`
- `Button` — `<Button>` / `<button>`

**Form:**
- `Input` — `<Input>` / `<input>`
- `Textarea` — `<Textarea>` / `<textarea>`
- `Select` — `<Select>` / `<select>`
- `Form` — `<form>`
- `Fieldset` — `<fieldset>`

**Media:**
- `Icon` — `<Icon>` / icon-role `<svg>`
- `Image` — `<Image>` / `<img>`

**Indicators / primitives:**
- `Badge` — `<Badge>` (canonical for Chip/Tag/Pill)
- `Divider` — `<Divider>` / `<hr>`
- `Chevron` — chevron icon
- `Arrow` — arrow icon
- `Dot` — dot indicator
- `Caret` — text caret indicator (blinking cursor in fake editor etc)
- `Spacer` — spacer element
- `Overlay` — full-cover decorative layer (flash, noise, gradient effect)
- `Skeleton` — loading placeholder block

**List items:**
- `Item` — `<li>`
- `Option` — `<Option>` (e.g. `OptionList.Option`, `<option>`)

**Table cells:**
- `Cell` — `<td>`
- `HeaderCell` — `<th>`

If the element you need doesn't fit any of these, the vocabulary needs expanding — discuss and extend the list. Never invent a suffix ad-hoc.

#### Picking the Role (prefix)

Role is picked by strict priority — stop at the first match:

1. **Data field** — if rendering a named data field, Role = PascalCase field name
   - `{action.description}` → Role `Description`
   - `{user.firstName}` → Role `FirstName`
2. **Domain concept** — if the element represents a named domain concept, Role = that concept
   - MethodBadge + Path together = `Endpoint` (REST term)
   - A form's submit area = `Submit`
3. **Qualifier** from fixed vocab — when multiple siblings share an ElementType:
   - Position: `Leading` / `Trailing` (horizontal), `Top` / `Bottom` (vertical)
   - Importance: `Primary` / `Secondary`
   - Function: `Search`, `Submit`, `Cancel`, `Confirm`, `Close`, `Empty`
4. **No role** — only when the element has no semantic role AND there is only one such element in its parent:
   - Disclosure chevron → `Chevron`
   - Lone header region → `Header`

#### Examples

```
.ActionBanner              // root (component name)
.EndpointRow               // role: Endpoint, type: Row (flex-row)
.PathCode                  // role: Path, type: Code (<code>)
.PrefixText                // role: Prefix, type: Text (<span>)
.SummaryParagraph          // role: Summary, type: Paragraph
.DescriptionParagraph      // role: Description, type: Paragraph
.DeprecatedBadge           // role: Deprecated, type: Badge
.Header                    // no role (only one), type: Header (landmark)
.SearchIcon                // role: Search, type: Icon
.SearchInput               // role: Search, type: Input
.EmptyParagraph            // role: Empty, type: Paragraph
.Chevron                   // no role (lone decoration), type: Chevron
```

#### Wrapper form (special)

A wrapper is an element with exactly one child, existing only for layout/positioning. Its class name is `[ChildClassName]Wrapper`:

- Wraps `.SearchIcon` → `.SearchIconWrapper`
- Wraps `.DeprecatedBadge` → `.DeprecatedBadgeWrapper`

(`Wrapper` IS an ElementType in this case — it's a concatenated form.)

Never create chained wrappers. If a layout property (`align-self`, `justify-self`) can go on the child directly, the wrapper must not exist.

#### Root form (only exception)

The component's root class is just the component name (no Role, no ElementType suffix):
- `.ActionBanner`, `.SearchModal`, `.Dialog`, `.Route`.

#### Forbidden

- Any class name that does NOT end with a vocabulary ElementType:
  - `.Description` ✗ (must be `.DescriptionParagraph`)
  - `.Endpoint` ✗ (must be `.EndpointRow` or similar)
  - `.Title` ✗ (must be `.NameHeading`, `.PageHeading`, etc.)
  - `.Name` ✗ (must be `.NameHeading` or `.NameText`)
  - `.Content` ✗ (must be `.ContentSection` or — more likely — the structure is wrong, extract a sub-component)
- Semantic group names without ElementType: `.Actions`, `.Meta`, `.Info`, `.Details`, `.Body`.
- Fantasy suffixes not in vocab: `.Container`, `.Inner`, `.Outer`, `.Group`, `.Block`, `.Panel`, `.Holder`.

If no rule matches unambiguously, the structure is wrong, not the name. Fix the structure (usually: make the parent flex/grid, or extract a sub-component).

### State selectors

- **Root states go on the component root class only** — never on a child. This covers `data-*`, `aria-*`, `:has()`, `:not()`, and any other state that describes the component's overall status. Child styling under a root state is done by nesting child selectors inside the state block on root.
- **Pseudo-class states on interactive leaf elements stay on the element.** `:hover`, `:focus`, `:focus-visible`, `:active`, `:disabled`, `:checked` on `Button`, `Link`, `Input`, `Textarea`, `Select`, `Option`, and other interactive primitives are states that belong to that element itself (it's what receives focus/hover). Don't hoist them to root.
- **Pseudo-element selectors (`::placeholder`, `::before`, `::after`, etc.) stay on the element** — they target the element's own pseudo-element.
- **State blocks come last** in a rule — after own properties and all child selectors.

### CSS rules

- All component/route CSS is wrapped in `@layer components`
- Use design tokens (`var(--spacing-2)`, `var(--border)`, `var(--intent-danger)`) — never hardcoded values
- **Never reset element defaults in component CSS.** The global reset (`src/styles/reset.css` under `@layer reset`) already strips browser defaults. The reset handles:

  | Element / Property | What's reset |
  | --- | --- |
  | `*, *::before, *::after` | `box-sizing: border-box`, `margin: 0`, `padding: 0` |
  | `ul`, `ol` | `list-style: none` |
  | `a` | `color: inherit`, `text-decoration: none` |
  | `button` | `font: inherit`, `color: inherit`, `cursor: pointer`, `background: none`, `border: 0` |
  | `input`, `textarea`, `select` | `font: inherit` |
  | `img`, `video`, `svg` | `display: block`, `max-width: 100%` |
  | `h1`–`h6` | `font-size: inherit`, `font-weight: inherit` (headings opt-in to their own styles) |
  | `th` | `text-align: left` |

  Never write any of these properties in a component CSS to "reset" them — the reset already did. If a property looks like a reset, ask: would the element have this anyway? If yes, delete the line. If no, the property is component-specific styling and belongs.

  **If a new reset is needed broadly**, add it to `src/styles/reset.css` — not per-component.
- **Never write vendor prefixes.** Build pipeline uses Lightning CSS, which auto-prefixes based on browserslist targets. Write the standard property only (`user-select: none`) — Lightning CSS adds `-webkit-*` / `-moz-*` / `-ms-*` variants if the targets need them. Manual prefixes are dead code and out of sync with build output.
- **Primitives (`*Base` components) have no `.module.css` files.** They are headless by design — consumers control all visual styling. Behavior-related rules (`user-select`, `cursor`, `pointer-events`) go inline via the `style` prop merged through `mergeProps`. Visual styling lives in the styled component one level up (`Button` for `ButtonBase`, `Checkbox` for `CheckboxBase`, etc.).
- **Prefer `flex`/`grid` + `gap` over `margin`** for spacing between elements. Default to gap when laying out siblings — restructure the parent into a flex/grid container when possible. Use `margin` only when gap can't express the spacing cleanly (asymmetric per-child spacing, non-uniform offsets between specific siblings, or when adding a parent flex container would cascade unwanted side-effects). When you reach for margin, make sure it's because gap genuinely doesn't fit, not because you skipped restructuring.
- **TOTALLY FORBIDDEN: `flex-grow`, `flex-shrink`, `flex-basis`.** Always use the `flex` shorthand. No exceptions.

  ```css
  /* ✗ Wrong */
  flex-shrink: 0;
  flex-grow: 1;
  flex-basis: 0;

  /* ✓ Right — common cases */
  flex: none;       /* don't grow, don't shrink, basis auto (= 0 0 auto) */
  flex: 1;          /* grow, shrink, basis 0 (greedy fill) */
  flex: 0 0 auto;   /* don't grow, don't shrink, basis auto (explicit) */
  flex: 1 0 auto;   /* grow, don't shrink, basis auto */
  flex: auto;       /* grow, shrink, basis auto (= 1 1 auto) */
  ```

  Why: `flex` always sets all three values explicitly. The longhand forms leave the other two undefined or at their browser defaults, which differ from what people expect (e.g., `flex-basis` defaults to `auto`, not `0`). One shorthand = one mental model.
- **Never leave unnecessary properties.** Every property must pay for itself in the specific context. Common dead properties to prune: `display: inline-block` on a flex/grid item (flex overrides it), `width: 100%` on a block element that already fills its container, redundant `color` that matches the inherited value, `margin: 0` on an element that has no default margin, `overflow: hidden` when nothing overflows, duplicate properties across sibling rules that could be merged.
- Use `background-color` — never the `background` shorthand (unless setting multiple background properties)
- Nesting is for structure and state — child elements are nested, pseudo-classes/data-attributes are nested

### CSS selector order

Within a selector block:

1. **CSS variable defaults** (the configurable knobs)
2. Own properties
3. Child element selectors
4. Pseudo-classes and state modifiers (`&:hover`, `&[data-*]`)

```css
.Sidebar {
  --sidebar-width: 320px;
  --sidebar-bg: var(--surface);

  display: flex;
  width: var(--sidebar-width);
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--rule);

  .SidebarHeader { ... }
  .SidebarList { ... }

  &[data-collapsed] { ... }
}
```

### CSS variable defaults

**Always declare defaults at the top of the root class** — never use the `var(--x, default)` fallback syntax.

```css
/* ✓ Right — defaults declared at top */
.Button {
  --button-size: 1rem;
  --button-color: var(--text);

  width: var(--button-size);
  color: var(--button-color);
}

/* ✗ Wrong — fallbacks scattered through the file */
.Button {
  width: var(--button-size, 1rem);
  color: var(--button-color, var(--text));
}
```

Why:
- **Single source of truth**: each default appears once. Used 5× in the file? Still one default at the top.
- **Discoverability**: the top of every component CSS reads like a config block. "What can I tune on this component?" → scroll to top, done.
- **DevTools-friendly**: the default value shows up in the inspector as the resolved property, not hidden inside a `var()` fallback string.
- **Consistent with design tokens**: yapyak's tokens (`--mint`, `--space-*`, `--ring`) are declared globally at the top. Component-local variables follow the same pattern at the component scope.

Consumers override via inline `style` on the component, which cascades through naturally:

```tsx
<Button style={{ '--button-size': '2rem' }} />
```

### State and variant styling

Use data attributes on the **root element** of a component for state and variants. Child elements are styled via parent nesting — they never carry data attributes themselves:

```css
/* Good — data attribute on root, children styled via nesting */
.Button {
  background-color: var(--surface-bevel);

  .ButtonIcon {
    color: var(--text-secondary);
  }

  &[data-appearance='solid'] {
    background-color: var(--intent-primary);

    .ButtonIcon {
      color: var(--intent-primary-contrast);
    }
  }

  &[data-disabled] {
    opacity: 0.5;
  }
}

/* Bad — data attribute on child */
.Button {
  .ButtonIcon {
    &[data-appearance='solid'] { ... }
  }
}
```

This applies to components that have variant-like behavior (appearance, size, state). Route files rarely need data attributes — if a route element needs variants, it should be extracted into a component.

### CSS nesting MUST mirror DOM structure — no exceptions

**STRICT RULE:** Every nested rule reflects the actual element hierarchy. A class lives at the exact same nesting depth in CSS as its element lives in the DOM. No flattened descendant selectors. No shortcuts.

```html
<div class="Button">
  <span class="Atom">
    <span class="Content"></span>
  </span>
</div>
```

```css
/* ✓ Right — CSS mirrors DOM */
.Button {
  .Atom {
    .Content {
    }
  }
}

/* ✗ Wrong — Content at root, doesn't reflect that it's inside Atom inside Button */
.Content {
}

/* ✗ Wrong — Atom at root, doesn't reflect that it's inside Button */
.Atom {
  .Content {
  }
}

/* ✗ Wrong — descendant combinator skipping a level */
.Button .Content {
}

/* ✗ Wrong — combined selector instead of nested */
.Button .Atom {
}
```

**No combined descendant selectors at the top level.** `.Button .Atom { ... }` is forbidden — must always be `.Button { .Atom { ... } }`. This includes `>` (child) combinators: `.Foo > .Bar` becomes `.Foo { > .Bar { ... } }`.

**Why:** reading the CSS instantly tells you the DOM shape. Refactoring an element's position in the JSX maps to moving its rule in the CSS. Nothing implicit.

**Exception: classes that legitimately appear at multiple DOM positions.** If a class can appear in more than one parent (used by multiple components, or recurring in different sub-trees of the same component), nest it under the **nearest common parent** — typically the closest ancestor where it always appears. Don't duplicate the rule under every possible parent.

```css
/* DOM: .Description appears inside both .Article.Body and .Article.Header */

/* ✓ Right — nest under nearest common ancestor (.Article) */
.Article {
  .Description {
    color: var(--text-soft);
  }

  .Body {
    /* body-specific stuff */
  }

  .Header {
    /* header-specific stuff */
  }
}

/* ✗ Wrong — duplicating the rule under each possible parent */
.Article {
  .Body {
    .Description { color: var(--text-soft); }
  }
  .Header {
    .Description { color: var(--text-soft); }
  }
}
```

If a class is truly shared across **multiple components** (not just multiple sub-trees), put it in `style.css` (global scope) at top level — those classes are documented as global utilities and aren't expected to mirror any specific DOM.

### Never flatten nested selectors

Always open a new nested block for each state/variant — never chain state and descendant in one selector. The state block wraps the child, the child is nested inside.

```css
/* Good — nested */
.Root {
  &[data-item-type='action'] {
    .TypeBadge {
      background-color: var(--color-blue-100);
    }
  }
}

/* Bad — flattened chain */
.Root {
  &[data-item-type='action'] .TypeBadge {
    background-color: var(--color-blue-100);
  }
}
```

Same rule for pseudo-classes combined with descendants:

```css
/* Good */
.Root {
  &:hover {
    .Icon { color: var(--intent-primary); }
  }
}

/* Bad */
.Root {
  &:hover .Icon { color: var(--intent-primary); }
}
```

## Return types — app code vs library code

**Default rule for app code: let TypeScript infer return types. Don't annotate.**

```tsx
// ✓ App code — inference
export function Button(props: ButtonProps) {
  const { className, ...restProps } = props;

  return <Box {...restProps} className={[styles.Button, className]} />;
}

// ✗ App code — unnecessary annotation
export function Button(props: ButtonProps): ReactElement {
  // ...
}
```

Inference is faster to read, faster to write, and keeps refactors cheap. The component's shape is obvious from the JSX.

**Annotate only when actually required:**

- The function returns multiple unrelated branches that TS infers too loosely (`string | number | ReactElement | undefined`)
- The component is part of a public package with `isolatedDeclarations: true` (kit packages, libraries)
- A specific generic signature can't otherwise be expressed (rare)
- The inferred type leaks an internal type alias that shouldn't be public API

**Library packages** under `packages/*` that consumers import (kit packages — ui, core, form, intl, cookie, symbol, etc.) extend `@skiftle/typescript-config/library`. That config sets `isolatedDeclarations: true`, which **requires explicit return types** on every exported function or component:

```ts
// ✓ Required in library packages
export function useThing(options: Options): UseThingReturn {
  // ...
}
```

The rule for libraries exists to keep public API surfaces stable: explicit return types are the contract; implementation changes can't accidentally widen or narrow the type. `apps/` and internal-only packages don't extend `library` — inference is preferred there.

When in doubt: if the package's `tsconfig.json` extends `@skiftle/typescript-config/library`, every exported function and component needs an explicit return type. Otherwise, infer.

## package.json conventions

Biome's `useSortedKeys` is disabled for `package.json` files (via `@skiftle/biome-config`). Alphabetical sorting breaks Node's exports resolution — conditions are checked in key order, first match wins. Sorting alphabetically can silently resolve to the wrong file.

### Top-level field order

Follow `sort-package-json`'s canonical order. Pragmatic subset:

```
name, version, private, description, keywords, homepage, bugs,
repository, license, author, type, imports, exports, main, types,
sideEffects, files, bin, scripts, dependencies, devDependencies,
peerDependencies, peerDependenciesMeta, optionalDependencies,
engines, packageManager, publishConfig, pnpm, workspaces
```

### `exports` condition order

Hard rules:
- `"types"` MUST be first (TypeScript stops at first match)
- `"default"` MUST be last (Node resolver fallback)
- `"source"` / `"development"` BEFORE `"import"` / `"require"` (bundlers pick these up first for unbundled dev)

Full canonical order: `types`, `source`, `development`, `browser`, `node`, `import`, `require`, `default`.

```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "source": "./src/index.ts",
      "development": "./src/index.ts",
      "browser": "./dist/browser.js",
      "node": "./dist/node.js",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    }
  }
}
```

Include only conditions a package needs; keep the relative order regardless of which subset is present.

### Sub-path export keys

`"."` first, rest alphabetical.

### Nested objects

Alphabetical — `scripts`, `dependencies` (and variants), `files`, `keywords`, `engines`, `pnpm.overrides`.

## Working with the user

These rules govern *when to act vs. when to stop and ask*. They override the default impulse to keep producing.

### Stop signals

The moment any of these appear, **stop and report — do not work around them**:

- A circular dependency between two hooks/components ("A needs B, B needs A")
- A `useEffect` whose only job is to keep a ref synced with a value
- An `as unknown as` or other type assertion to make something compile
- A "fallback" or default that exists because two call sites disagree on what's required
- A bridge layer that converts the same data back and forth (`Set` → array → `Set`)
- The thought "this is fine, the consumer can opt out via..."

These are signals that the *design* is wrong, not that you need a cleverer workaround. Refs+effects to break circles are not a fix — they are evidence the relationship was wrong from the start.

### Defaults and optional props

- **Never add a default value or optional prop the user didn't ask for.** No `autoFocus = true`, no `'aria-label' = 'Options'`, no `?? true` to allow opting out.
- If a prop should exist, it's explicit and required. If it shouldn't, it doesn't exist.
- When tempted to write `?? defaultValue`, ask: should this prop exist at all? If yes — is it required? If no — delete it.

### Composition layers

- Respect the layering the user has stated. If the architecture is `A → B → C`, do not let `A` reach into `C` directly to "save a layer". The intermediate layer exists for a reason; bypassing it is a design change disguised as an implementation detail.

### "Kör" / "go ahead" scope

- "Kör" means: do the *specific* thing we just discussed, then stop and report. Not the next three things you can foresee.
- After completing a single instruction, return to the user before proceeding. Do not chain forward.

### Ambiguity

- If two reasonable interpretations of the user's instruction exist, ask. Do not pick.
- "Vague enough that I'm guessing" = stop.
- A 30-second clarifying question is cheaper than a 30-minute refactor that gets rolled back.

### Production cadence

- Producing code is not the goal. Building the right thing is.
- It is correct and expected to spend a turn saying "this design is wrong, here is why, what do you want to do?" — that is work, not stalling.
