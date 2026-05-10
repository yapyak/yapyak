# yapyak 🐃

> **Translations are a side-effect.**
>
> The i18n library where your source code is the truth.

In 2026, every product team ships copy at the speed they ship code. A button label changes three times a day. An empty state gets rewritten mid-sprint. Marketing pushes a paragraph at 17:00. The old i18n flow — extract, push to a translation portal, wait for a human, pull, build, deploy — was built for a world that doesn't exist anymore.

The new world has AI good enough to translate 90% of UI copy on the first try. With a voice prompt and call-site context, 95–100%. The bottleneck stopped being the translation. It became the loop around it: keys to invent, files to sync, PRs that block on a translator, code that refers to abstract IDs you have to grep to understand.

yapyak deletes that loop.

You write English in your component. You save the file. Every other locale auto-fills via the AI of your choice, in your voice, with knowledge of the surrounding code. HMR pushes the new strings live before you alt-tab. There is no `en.json` on disk because your code *is* English. Translations are derived. They are side-effects.

Your repo gets one folder — `locales/sv.json`, `locales/no.json`, `locales/dk.json`, etc. — and that's it. If you delete `locales/sv.json`, Swedish stops existing. Nothing else changes.

> *"This is the first i18n library that didn't make me want to throw my keyboard."*
>
> — a developer, somewhere, allegedly 🐃

---

## Quick start

```bash
pnpm add yapyak
pnpm exec yapyak init
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';
import { anthropic } from 'yapyak/translators/anthropic';

export default defineConfig({
  plugins: [
    yapyak({
      persistence: 'cookie',
      translator: anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        voice: 'Casual, thoughtful, never corporate.',
      }),
    }),
  ],
});
```

```tsx
// any component
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

That's it. Save the file. Every locale in `locales/*.json` fills in via Anthropic, in your voice, with the call-site context. HMR pushes the new copy live. No keys to invent, no JSON to wire up, no `auth.error.invalid_2` to decode three months later.

---

## Why yapyak

### The translation is the key

Translation keys are a special kind of hell. `home.hero.cta.signup.button` — does it sign up or log in? Who knows. You named it, then someone changed the copy, and now the key lies. Or you skip naming and call it `key1`. Or you commit to a naming convention nobody else on your team agrees with. Or you pick i18next and end up with a dot-namespaced ontology that you grep through every time you read the code.

yapyak takes a different swing: **the translation is the key**. You write `t('Save changes')`. The string itself *is* the lookup. There's nothing to name, because the source language already names it.

This is what Tailwind did to CSS class names. Externalizing CSS into `.scss` files with hand-named classes was supposed to be cleaner. It wasn't — it was a permanent naming meeting nobody asked for. Tailwind put the styling next to the markup, where it belongs, and named class meetings stopped happening. yapyak does the same to translation keys: it puts the meaning next to the call site, where it belongs.

This matters double in the agent era. When Claude or Cursor reads `t('Switch to dark mode')` in your source, it sees the meaning right there. No round-trip to look up what `header.toggle.aria` actually is. The call site is the documentation. Agents like that. Humans like that. Reviewers in PR-checks like that. When the agent rewrites a button, it rewrites the user-facing English directly — not a key indirection that may or may not be rewired correctly.

### Translations are side-effects

Most i18n libraries treat every locale as equal: `en.json`, `sv.json`, `de.json`, all parallel files of equal weight. This is a lie. The default locale isn't a translation — it's the source of truth. Treating it as a parallel file invites drift between code and `en.json`, and creates a "translation review" step for the language you wrote in.

yapyak does not have an `en.json`. The default locale lives in your source code. Other locales are projections of it. When you change `t('Save')` to `t('Save changes')`, the source is updated atomically — there's only one place to update. Other locales become stale and re-translate.

```
locales/
  sv.json      ← side-effect
  no.json      ← side-effect
  dk.json      ← side-effect
```

Your project gets smaller. Your mental model gets simpler. The thing that's always true is always true: *your code is what users in your default language see*.

### AI is built in. Use it like an HMR layer

yapyak ships with translators for Anthropic and OpenAI out of the box. Drop in an API key, set your voice, save a file. Translations happen.

```ts
yapyak({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    voice: 'Personal blog voice. Casual, thoughtful, never corporate. Match the original cadence.',
    glossary: {
      'sign in': { sv: 'logga in', no: 'logg inn', dk: 'log ind' },
      'cart': { sv: 'varukorg', no: 'handlekurv', dk: 'kurv' },
    },
  }),
}),
```

What happens on save:

1. Plugin extracts every `t('...')` call from your source.
2. New strings get an empty stub in each non-default locale file.
3. Translator sends a JSON batch to the AI provider — up to 10 strings per request — with the source string, the component name, the enclosing JSX/template element, your voice, and your glossary.
4. AI returns translations. Plugin writes them to disk.
5. HMR pushes the new copy into your running app.

Total wall-clock time for a fresh translation: about a second per batch. 10× fewer API calls than naive one-string-at-a-time approaches.

The translator interface is open — bring your own. Local model? Cloudflare Workers AI? Your fine-tuned 7B? Implement the `Translator` type, drop it in. yapyak doesn't care which model translates; it cares that *something* fills the stubs.

```ts
interface Translator {
  (request: TranslateRequest): Promise<string>;
  batch?(requests: TranslateRequest[]): Promise<string[]>;
}
```

No yapyak Cloud. No subscription tier. No monetization play. This is built to be useful, not to be sold.

### Voice that holds across releases

A consistent tone is the hardest part of multi-language UI. Different translators introduce different voices. AI services drift between calls if they don't have grounding. Marketing-tone-but-friendly is a vibe, not a regex.

yapyak makes voice a first-class config:

```ts
voice: 'Personal blog voice. Casual, thoughtful, never corporate. Match the original cadence.'
```

This string gets prepended to every translation prompt. Every string, every locale, every release. There is no drift across translators, because there is one translator, and one voice. When you change the voice, you re-translate with `pnpm exec yapyak translate --force`. Done.

### Position-aware rename memory

Source-string-as-key has one classic trap: change `t('Save')` to `t('Save changes')` and you've effectively renamed the key. Naive implementations lose the existing translation. The careful "Spara" your translator picked? Gone. The agent has to redo work.

yapyak solves this with **position-based rename detection**. When a file changes, the plugin compares positions of every `t()` call against the previous extraction. If a string disappeared at line 23, column 12, and a new string appeared at *the exact same position*, that's not a delete-and-add. That's a rename.

```diff
- t('Save')
+ t('Save changes')
```

```
[yapyak] ↻ "Save" → "Save changes" (rename detected, locale entries migrated)
[yapyak] sv: marked stale, re-translating…
```

Locale files get the key swapped (translations preserved). The new English value triggers a re-translation pass. The old "Spara" stays as a temporary placeholder until the new "Spara ändringar" lands a beat later. No lost work, no orphaned translations.

Why position-based and not similarity-based? Because **position is exact**. "Save" and "Cave" have a 75% Levenshtein similarity but they're different messages. Position match is unambiguous: same place in your code, you renamed it, period. False positives don't happen.

### Same English, different contexts, different translations

`t('Save')` on a form button means "submit the form" — Swedish: *Spara*. `t('Save')` on a settings page means "preserve to disk" — also *Spara*, mostly, but maybe *Bevara* depending on context. Same English, different intent.

Most i18n libraries make you invent unique keys: `form.save_button` vs `settings.save_action`. yapyak handles it for you: each `t()` call's storage key is `(filePath, sourceString)`, so the same English in two files produces two independent entries. Edit either translation in the JSON without affecting the other.

```json
{
  "src/components/employee-form.tsx": { "Save": "Spara" },
  "src/components/contract-actions-bar.tsx": { "Save": "Bevara" }
}
```

You don't think about it. You write `t('Save')` everywhere. yapyak handles the disambiguation. The AI gets the file path, the component name, and the enclosing JSX/template element (`button`, `h1`, `label`, `option`) as context — so it can translate "Save" the verb differently from "Save" the noun without you ever annotating anything.

### Type safety, including parameters

The runtime is small. The type system is strict.

```tsx
t('Hello {name}', { name: 'Joakim' })   // ✓ params inferred from {name}
t('Hello {name}')                         // ✗ TypeScript error: missing { name }
t('Hello')                                // ✓ no params allowed
t('Hello', { name: 'Joakim' })            // ✗ TypeScript error: no params expected

t('You have {count, plural, one {# item} other {# items}}', { count: 3 })
//          ^^^^^                                              ^^^^^^^^
//          ICU plural — count: number is required
```

Param names and types are derived from the string literal at compile time. You can't pass the wrong shape because TypeScript knows what shape the string asks for. Plurals, selects, named placeholders — all standard ICU MessageFormat.

### One `t`, every framework

The same `t` function works in React, Svelte 5, Vue 3, and any plain JavaScript context. Reactivity is the only framework-specific piece, exposed as `useLocale`.

```tsx
// React
import { t } from 'yapyak';
import { useLocale } from 'yapyak/react';

function App() {
  const [locale, setLocale] = useLocale();
  return <h1>{t('Hello')}</h1>;
}
```

```svelte
<!-- Svelte 5 -->
<script lang="ts">
  import { t } from 'yapyak';
  import { useLocale } from 'yapyak/svelte';
  const locale = useLocale();
</script>

<h1>{t('Hello')}</h1>
<button onclick={() => (locale.current = 'sv')}>SV</button>
```

```vue
<!-- Vue 3 -->
<script setup lang="ts">
import { t } from 'yapyak';
import { useLocale } from 'yapyak/vue';
const locale = useLocale();
</script>

<template>
  <h1>{{ t('Hello') }}</h1>
</template>
```

The plugin processes `.ts`, `.tsx`, `.js`, `.jsx`, `.svelte`, and `.vue` files. `t()` calls in templates work the same as in scripts. Same import. Same call site. Same compiled output.

### SSR-correct, no flicker

Set the adapter and yapyak resolves the locale per request from the cookie or `Accept-Language` header — pre-rendered HTML in the right language from the first byte.

```ts
// React + TanStack Start
import { tanstackStart } from 'yapyak/adapters/tanstack-start';
tanstackStart();

// Svelte + SvelteKit
import { sveltekit } from 'yapyak/adapters/sveltekit';
// hooks.server.ts:
export { handle } from 'yapyak/adapters/sveltekit';
```

Under the hood, the adapters use AsyncLocalStorage-backed request scoping (TanStack's `getRequestHeaders()`, SvelteKit's `getRequestEvent()`) so `getLocale()` returns the right value during SSR for *that specific request*. There is no global state pollution between concurrent requests.

```tsx
// __root.tsx — the entirety of your <html lang>:
<html lang={getLocale()}>
```

Same import on server and client. Same return type. Same call site. There is no `if (typeof window === 'undefined')` to write.

### Persistence: cookie, localStorage, or none

```ts
yapyak({
  persistence: 'cookie',         // SSR-safe (default)
  // OR
  persistence: 'localStorage',   // SPA-only, GDPR-friendly
  // OR
  persistence: null,             // in-memory, refresh resets
})
```

**Cookie** is what most SSR apps want. Sent with every request, so the server can read it and ship pre-rendered HTML in the right language.

**localStorage** is for pure SPAs (no SSR) or apps that want to dodge cookie-banner requirements. Tradeoff: server can't read it, so first paint is in default locale and the client swaps in the user's locale after hydration.

**`null`** is the default — no persistence, refresh resets. Useful for ephemeral sessions or when another mechanism handles persistence.

### Locale auto-discovery

You don't list locales in your config. yapyak finds them by reading `locales/*.json`. Add a file → it's a locale. Delete a file → it's gone. The default locale is configured (defaults to `'en'`); it does not need a file because your source code is the file.

```
locales/
  sv.json
  no.json
  dk.json
```

This config implies `defaultLocale: 'en'`, `locales: ['en', 'sv', 'no', 'dk']`. No vite-config plumbing.

### Vite-only

yapyak only exists because Vite exists. The "save a file, the right thing happens, immediately" experience that makes the whole watcher loop feel like magic — that's Vite's contribution to the field, and Evan You and the team did the hard work. We're just standing on it.

So we made a deliberate choice: Vite-only. Going framework-agnostic would mean meeting eight different bundlers' edge cases halfway and pleasing none of them. We'd rather be excellent in one place than mediocre everywhere. If you're on Webpack or Rollup-without-Vite, we're not your tool, and that's fine.

### Compile-time call-site rewrite

Each `t('...')` call is rewritten at build time into a direct call that has all locale variants inlined:

```ts
// You write:
{t('Save changes')}

// Plugin rewrites to:
__yapyak_pick({ en: 'Save changes', sv: 'Spara ändringar', no: 'Lagre endringer' })
```

The runtime helper reads the current locale from the store and returns the matching value. Per-call inlining means Vite/Rollup can dead-code-eliminate per chunk: a route that doesn't import `Save changes` doesn't have its translations in the bundle. Bundle size scales with strings used per chunk, not total strings in the project.

### CLI: zero deps, instant

```
yapyak init                 scaffold locales/, vite config, .env
yapyak status               coverage report per locale
yapyak status --json        machine-readable, exits 1 if any missing
yapyak check                exits 1 if anything is missing — for CI
yapyak add <locale>         add new locale, auto-translate everything
yapyak translate            fill missing translations via AI
yapyak translate --force    re-translate everything, including existing values
yapyak translate sv         only this locale
```

The CLI has zero runtime dependencies (uses Node + ANSI escape codes). Boots fast. Looks decent in a terminal. Doesn't pretend to be a TUI framework.

### Untranslated default-locale strings? No problem

If you haven't run `translate` yet, untranslated locale entries are empty strings. The compiled output falls back to the source string for any missing locale value. Your app renders English in Swedish until Swedish exists. No errors, no `[missing translation key: ...]` placeholders, no flicker.

Add the key, save, untranslated. UI shows English. Run translate, save. UI shows Swedish. The transition is invisible to your runtime — your code is correct in either state.

### Forced-locale rendering

For server emails, multi-locale digests, or testing:

```ts
t.in('sv')('Welcome back')                          // 'Välkommen tillbaka'
t.in('no')('Hello {name}', { name: 'Ole' })         // 'Hei Ole'
```

Same compile-time rewrite, just with the locale baked in. Useful for sending an email to a user whose preferred locale isn't the request locale.

### No monetization

Built for our own products. There is no Cloud, no SaaS tier, no upsell, no MCP-server-as-a-service, no commercial plan. Bring your own AI key. MIT license. If a feature gets built, it's because we needed it. If a feature isn't built, you can build it — the code is small enough to read in an afternoon.

---

## What yapyak doesn't do (yet)

- **Rich-text translations** — for now, `t()` returns a string. JSX-with-formatting (`<Trans>Hello <strong>{name}</strong></Trans>`) isn't supported. Coming when we need it.
- **Webpack support** — see "Vite-only" above. Not coming.
- **A SaaS dashboard** — see "No monetization" above. Not coming.
- **MCP server** — earlier drafts had this. We ripped it out. Auto-translate-on-save makes the agent-tool layer redundant: there's nothing for the agent to do that the plugin doesn't already do faster. If you want to translate from chat, just ask Claude — it already has access to your filesystem and your `.env`.

---

## What about the agent in my editor?

You'll still talk to it. But not for translation — for *editing* translations. The flow is:

1. You write `t('Save changes')`. Plugin auto-translates.
2. The Swedish translation feels off. You ask Claude: *"hej, ändra svenska översättningen av 'Save changes' till något snabbare, typ 'Spara'."*.
3. Claude opens `locales/sv.json`, edits the entry, saves. Plugin sees the file change, HMR pushes the new value. You see it live.

The agent is a fast translator-correction interface. It's not the translator. The translator is yapyak. The model providing the actual MT can be the agent's underlying model (Claude, GPT-5, etc.) — same model, just routed through a plugin instead of a chat message. Faster, no chat-context overhead, no copy-paste.

---

## Comparisons

**vs. Lingui.** Closest peer. Lingui has source-as-keys via macro. Major differences: Lingui needs a separate `extract` + `compile` cycle (yapyak is automatic on save), Lingui uses TMS workflows for translation (yapyak uses AI built in), Lingui has a default-locale file (yapyak doesn't).

**vs. i18next.** Different universe. i18next has abstract dot-namespaced keys, manual JSON management, runtime parsing. Powerful, but ceremony-heavy. yapyak is the answer to "what if we just deleted all that".

**vs. next-intl, paraglide, vue-i18n.** All abstract-key-based. All require external translation files for default locale. None integrate AI translation. yapyak picks a different fork.

**vs. Crowdin / Lokalise / Phrase.** TMS clouds. Translator-portal-and-PR-loop. Built for the world where translation took weeks. yapyak is built for the world where it takes seconds.

---

## Frameworks shipping today

- **React** + TanStack Start (SSR adapter)
- **Svelte 5** + SvelteKit (SSR adapter)
- **Vue 3** (SSR adapter coming when someone needs it)

Same `t()` everywhere. Framework-specific imports only for `useLocale` reactivity hooks.

---

## Install

```bash
pnpm add yapyak
pnpm exec yapyak init
```

Drop the resulting `vite.config.ts` snippet in. Add `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) to `.env`. Start writing `t('strings')`. Save. Done.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';
import { anthropic } from 'yapyak/translators/anthropic';

export default defineConfig({
  plugins: [
    yapyak({
      persistence: 'cookie',
      translator: anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        voice: 'Casual, thoughtful, never corporate.',
      }),
    }),
  ],
});
```

The README is the docs. The code is small enough to read in an afternoon. The CLI tells you what's missing. The plugin tells you when it can't translate something. There's no "comprehensive guide" to read because there isn't that much.

Yak away. 🐃

---

MIT license. No telemetry. No phoning home. Built by [@qwuide](https://github.com/qwuide).
