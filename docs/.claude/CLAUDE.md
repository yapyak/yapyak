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
✓ *"An adapter wires yapyak to your SSR framework so each request renders in its own locale."*
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

#### Examples never show explicit return types

Guide code examples target what a *reader would write*, not what the library's `isolatedDeclarations` setting enforces internally. Inference is the everyday TypeScript flow. Don't import `ReactElement` / `JSX.Element` just to annotate the return.

✗ Banned in examples:
```tsx
import type { ReactElement } from 'react';
function Component(): ReactElement {
  // ...
}
```

✓ Acceptable in examples:
```tsx
function Component() {
  // ...
}
```

Same rule for arrow functions: don't write `(): ReactElement => ...` in guide examples. The point of the example is the surrounding logic, not annotation discipline. (yapyak's own library code follows `isolatedDeclarations` per the root [CLAUDE.md], but that's an internal-correctness concern, not an example-pedagogy concern.)

#### The single-source rule

> Each concept lives in exactly one file. Every other mention is a link.

This is the most violated rule. The audit pass catches it. To prevent regression:
- Before writing more than two sentences explaining a concept, check the canonical-home table above.
- If the concept has a home elsewhere — delete what you wrote, write a link sentence instead.
- If the concept *doesn't* have a home — establish one (add to the table) and write the explanation there. Other pages link.

#### Don't editorialize about provider models

yapyak's docs list what's *supported*. They do not opine on which model is "higher quality", "cheaper", "better for non-Latin scripts", "strong on idiom handling", or similar. Reasons:

1. Provider model lineups change quarterly. Any recommendation ages instantly.
2. It's not yapyak's place to compare external AI vendors.
3. Cost/quality trade-offs depend on the user's specific workload — they read provider docs themselves.

✗ Banned phrasings in `model` columns and provider pages:
- *"`X` for higher quality, `Y` for lower cost"*
- *"Any Claude model. `X` for accuracy, `Y` for speed."*
- *"Empirically strong on non-Latin scripts"*
- *"Approaches cloud-model quality"*
- *"Cost-effective multilingual translation"*
- *"Trained on Google's translation pipeline"*

✓ Acceptable:
- *"Any Claude model."* (in the default-value table)
- *"Set via `.env.local` (`ANTHROPIC_API_KEY`)."*
- Practical commands: *"Pull the model: `ollama pull llama3.1`. Point yapyak at it: `ollama({ model: 'qwen3:32b' })`."*
- Brand-fact differentiation that doesn't quality-rank: *"Ollama runs locally. No API key required."*

If a section reads as "Why use *this provider*", delete it.

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

