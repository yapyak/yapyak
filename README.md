# yapyak 🐃

> **Let your app yak in any language.**
>
> The agent-first i18n library for your Vite app. Built for the era where Claude Code, Cursor, and Devin sit in your dev loop and handle the translation work themselves — yapyak just gives them the right tools.

So let's face it: every translation library so far has kind of sucked. The tooling around them has evolved a lot. The DX around them has evolved. And yet, somehow, the translation libraries themselves have been frozen in time — about as stiff and stuck as the printing industry. Important, sure. Better not to touch it, sure. It works, sure. But the *thing* is: today, it's completely unnecessarily clunky. The world has moved on. The only reason nothing's moved with it is that legacy libraries are stuck dragging backwards compatibility behind them like a tail.

yapyak doesn't have that problem. Not for the next few years, anyway. It's written from scratch with today's tooling in mind: Vite, AOT compilation, **MCP-driven agent workflows**, file-scoped keys, AsyncLocalStorage SSR. No legacy. No baggage. No 2014.

The goal of yapyak is to eliminate all of that — and not feel enterprise-y while doing it. And ride the agent wave a little while we're at it.

> *"Finally someone rethought this whole darn thing."*
>
> — a developer, somewhere, allegedly 🐃

### Vite-only

Yapyak only exists because Vite exists. The "save a file, the right thing happens, immediately" experience that makes the whole watcher loop feel like magic — that's Vite's contribution to the field, and Evan You and the team did the hard work. We're just standing on it.

So we made a deliberate choice: Vite-only. Going framework-agnostic would mean meeting eight different bundlers' edge cases halfway and pleasing none of them. We'd rather be excellent in one place than mediocre everywhere. If you're on Webpack or Rollup-without-Vite, we're not your tool — and that's fine.

### Agent-first

The other deliberate choice: yapyak does not have a built-in AI translator. It used to. We ripped it out.

Here's what changed our mind. In 2026, the average dev opening a Vite project already has Claude Code or Cursor running in another pane. That agent has read the whole codebase. It knows the team's voice. It can be asked clarifying questions. It has better LLM access than yapyak will ever provision through a config field. So we asked: who is the AI in `ai: { provider: 'anthropic', apiKey: '...' }` actually serving? Not the user — they already have a better one. Not yapyak — we don't want to be a billing layer.

So we removed it. yapyak now ships an MCP server instead. The agent already in your dev loop drives the translation work directly, using its own LLM call, with full call-site context yapyak hands it. More on that below.

---

## Quick start

```bash
pnpm add yapyak
pnpm exec yapyak init
```

```ts
// vite.config.ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      framework: 'react',
      adapter: 'tanstackStart',
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      persistence: 'cookie',
      overlay: true,
    }),
    tanstackStart(),
  ],
});
```

```jsonc
// .mcp.json (project root)
{
  "mcpServers": {
    "yapyak": { "command": "pnpm", "args": ["exec", "yapyak", "mcp"] }
  }
}
```

```tsx
// app.tsx
import { IntlProvider, t } from 'yapyak';

export function App() {
  return (
    <IntlProvider>
      <h1>{t('Hello')}</h1>
    </IntlProvider>
  );
}
```

That's it. Save the file — the plugin extracts `'Hello'`, writes `locales/en.json`, stubs an empty entry in `locales/sv.json`. Then you say to your agent: *"fyll i alla saknade översättningar på svenska"*. It calls yapyak's MCP tools, reads the call-site context, writes the JSON. HMR pushes the new translation into your running app. No build step, no API key, no provider config.

A 🐃-button appears in the bottom-right of your dev page — click it any time to see all your translations, edit inline, preview the app in another locale. More on that below.

---

## Why yapyak

### No more naming things

Translation keys are a special kind of hell. `home.hero.cta.signup.button` — does it sign up or log in? Who knows. You named it, then someone changed the copy, and now the key lies. Or you skip naming and call it `key1`. Or you commit to a naming convention that nobody else on your team agrees with.

yapyak takes a different swing: **the translation is the key**. You write `t('Save changes')`. The string itself *is* the lookup. There's nothing to name, because the source language already names it. Think of what Tailwind did to CSS class names — same energy. Less friction.

This matters double in the agent era. When Claude Code reads `t('Switch to dark mode')` in your source, it sees the meaning right there. No round-trip to look up what `header.toggle.aria` *is*. The call site is the documentation. Agents like that. Humans like that. The 2026 i18n debate of "natural-language keys vs explicit keys" — we picked a side, and Lingui 6.0 picked the same side a month later for the same reasons.

If two files happen to use the same source text but want different translations? That's fine — translations are scoped per file. `t('Save')` in your settings page can be `'Spara'`, while `t('Save')` in your editor can be `'Spara ändringar'`. Same key, different files, no collisions, no bikeshedding.

### Agent-first via MCP

This is the one we built the rest of the library to enable.

Drop `.mcp.json` in your project root with the snippet from the quick-start. Restart Claude Code (or Cursor, or any other MCP client). Now your agent has tools:

| Tool | What it does |
|---|---|
| `get_config` | locales, defaultLocale, source patterns — the agent's first call |
| `list_messages` | every translatable string with current state across locales |
| `list_missing` | what's untranslated, optionally filtered by locale |
| `read_message` | full call-site context: file, component, line, snippet, parent JSX element, attribute name |
| `write_translation` | single atomic write |
| `write_translations` | batched per-locale writes for filling many at once |
| `remove_translation` | revert to "missing" so it gets re-translated |
| `prune_stale` | auto-remove entries whose source no longer exists in code |
| `validate` | missing / stale / invalid JSON, each with an `autoFixable` flag |

Then you just talk to it: *"översätt allt nytt på svenska"*, *"ta bort 'Bradn ddd' från en.json, det var en typo"*, *"validate och fixa allt som är autoFixable"*. The agent reads context, calls the model it already has access to, writes the files. You watch it happen. You correct it inline. It learns from the correction.

Why this beats baked-in AI translation:

- **Your agent has better context than yapyak ever could.** It's read your whole codebase. It's read your `CLAUDE.md`. It knows your voice, your glossary, the decision your team made last Tuesday about how to translate "boka pass". You wrote zero config to make any of that happen.
- **Your agent has clarifying questions.** Generic AI translation guesses. An agent asks: *"Is this 'Archive' the verb or the noun? It looks like a button label, so I'm leaning verb — confirm?"* Then it gets it right.
- **Your agent's billing is your problem, not yapyak's.** No `apiKey` in `vite.config.ts`. No second model registration. No worry about whether yapyak is skimming a margin off your translations. (We're not. Ever. There is no yapyak Cloud and there will not be one.)
- **Switching agents costs you nothing.** Move from Claude Code to Cursor to Devin tomorrow. yapyak doesn't care, doesn't know, doesn't break. The MCP layer is the contract; everything else is the agent's problem.
- **The agent picks up your project conventions automatically.** Your `CLAUDE.md` says "use sentence case, never title case in Swedish UI"? The agent reads that before it writes a single translation. yapyak couldn't compete with that even if we tried.

The MCP server is built into the package — no `@modelcontextprotocol/sdk` dep, no second install, just `pnpm exec yapyak mcp` and it speaks JSON-RPC over stdio. Tolgee has AI in their cloud. Languine is a CLI calling an API. Lingui ships "skills" for code generation but no tools-MCP for translation work itself. yapyak is the only library that gives your agent *tools to actually translate your project*. 🐃

### Watch mode keeps your locales honest

Save a file. The plugin extracts every `t()` call, syncs `en.json`, and stubs new entries in your other locale files as empty strings. Removed strings vanish from `en.json` — and the watcher updates the position cache so you keep rename memory across saves (more on that below).

```diff
+ t('Welcome home')
```
```
[yapyak] en.json: +1 entry · sv.json: +1 stub (awaiting translation)
```

That's the entire watcher contract. No CLI loop, no manual `yapyak extract`, no "remember to run something before commit". You write code, the JSON files keep up. You ask the agent to fill the stubs whenever you feel like it.

### Typed to the bone

Locale codes are a discriminated union: `setLocale('haha')` is a TypeScript error. Translation params are inferred from the source string: `t('Hello {name}')` *requires* `{ name }`, `t('Hello')` *forbids* a second argument. Mess up your ICU plural? You'll know at compile time.

### Autocomplete that actually knows your strings

This is the part where i18n libraries usually shrug. Either your keys are abstract identifiers (autocomplete works, but you've already lost), or your keys are the strings themselves and autocomplete just gives up.

yapyak does both. The Vite plugin reads your locale files, generates a literal-typed union of every source string in your project, and rewires `t()` to autocomplete on it — while *still* letting you type a new string the second you need one. No registration step. No "add this to your messages.json first" dance.

```tsx
t('R')   // ↑ autocomplete suggests "Recent writings"
t('Save changes')   // ↑ autocomplete from history
t('A brand new string nobody has translated yet')   // ✅ also fine
```

The TypeScript trick is `T extends KnownSource | (string & {})` — known strings get autocomplete; new strings get accepted; nothing gets in your way. You also get autocomplete on `messages.sv['src/routes/home.tsx']['Recent writings']` if you really want to spelunk into the raw data. Refactoring is suddenly real: rename a string, find every site, fix typos with one click.

Most i18n libs treat types as a stretch goal. yapyak treats them as table stakes. 🐃

### Tiny footprint

The usual i18n library asks you to install a dozen sub-packages, scaffold a directory tree, configure a Babel plugin, and figure out where the messages live. yapyak is one package with a Vite plugin and a built-in MCP server. Everything else — the runtime module, the messages module with all locales inlined and tree-shaken per route, the type declarations — is generated and cached invisibly inside `node_modules/.cache/`. Your repo gets `locales/sv.json`, one `.mcp.json`, and one ugly line in `tsconfig.json`:

```jsonc
{
  "include": ["src/**/*", "node_modules/.cache/yapyak/types.d.ts"]
  //                       ^ yes, this is the ugliest line in your config.
  //                         we hate it too. but TypeScript needs to find
  //                         the auto-generated types somewhere, and this
  //                         is the only place it doesn't pollute. promise:
  //                         this is the ugliest yapyak ever asks you to be.
}
```

That's it. `yapyak init` adds it for you. After that, you never touch it again.

### One `getLocale()`, two universes

This is the part where most i18n libs split into a server function and a client function and you have to remember which is which. yapyak doesn't.

```ts
import { getLocale } from 'yapyak';

const locale = getLocale();   // works on the server, works in the browser
```

Same import. Same call site. Same return type. There is no isomorphism dance. There is no `if (typeof window === 'undefined')`. It just works.

The detection chain, both server and client:

1. **Cookie** — the user's explicit choice (`Cookie:` header on the server, `document.cookie` in the browser). Highest priority.
2. **Browser/OS preference** — `Accept-Language` header on the server, `navigator.language` in the browser. The user's actual default if they haven't picked one yet.
3. **Default locale** — the fallback you configured.

```tsx
// __root.tsx — the entirety of your <html lang>:
<html lang={getLocale()}>
```

That's it. SSR with the right language from the first byte. Client takes over after hydration with no mismatch (the cookie is the same source on both sides). Locale-switching just updates the cookie and the cached value.

### Persistence: cookie or localStorage

Yapyak persists the user's locale choice somewhere — your call where:

```ts
yapyak({
  persistence: 'cookie',         // SSR-safe
  // OR
  persistence: 'localStorage',   // SPA-only, GDPR-friendly
  // OR
  persistence: null,             // in-memory only (default), refresh resets
})
```

**Cookie.** The only option that works with SSR. Sent with every request, so the server can read it and ship HTML pre-rendered in the right language. This is what most SSR apps want.

**localStorage.** Use this if your app is a pure SPA (no SSR), or if you want to avoid cookies for GDPR reasons (localStorage is exempt from cookie-banner requirements in most jurisdictions). Trade-off: the server can't read it, so the first paint always renders in the default locale and the client swaps in the user's locale after hydration. Brief flash possible.

**`null` (default).** No persistence. Refresh resets to default. Useful for ephemeral sessions, demos, or apps where another mechanism handles the persistence.

Need sessionStorage, IndexedDB, or a custom backend? Leave `persistence` unset and call `setLocale()` yourself with whatever storage you want — `getLocale()` and `setLocale()` are the primitives, and they work without any persistence layer attached.

### SSR-ready, no manual wiring

Set `adapter: 'tanstackStart'` (or `'sveltekit'`) in plugin options and yapyak figures out the locale on the server by reading the request cookie via the framework's request-scoped headers. The HTML ships pre-rendered in the right language. No flash, no `useEffect`-flicker, no `loader` boilerplate.

```tsx
// __root.tsx — this is the entirety of your SSR setup
<html lang={getLocale()}>
  <body>
    <IntlProvider>
      <Outlet />
    </IntlProvider>
  </body>
</html>
```

The adapter wires `setRequestSource` to TanStack's `getRequestHeaders()` (or SvelteKit's `getRequestEvent()`) automatically. You don't write the wiring; you don't import the wiring; you just set one config field.

### Position-aware translation memory

Here's the trap with source-string-as-key i18n: the moment you change `t('Save changes')` to `t('Save')`, you lose the connection to the existing translation. Your agent's careful work — that "Spara ändringar" tweaked just so to fit your brand voice — disappears. Your French team's nuanced phrasing? Gone. The German guy's diplomatic compromise? Gone. The agent now has to re-translate from scratch, and might land on a slightly different word this time.

Every other source-string-as-key library has this problem. They wave their hands at it.

yapyak doesn't. 🐃

When you save a file, yapyak compares the **positions** of every `t()` call against a position cache from your last save. If a string disappeared at line 12, column 5, and a new string appeared at the *exact same position*, that's not a deletion-and-addition. That's a rename. The translation is preserved. The agent isn't asked to redo work it already did.

```diff
- t('Save changes')
+ t('Save')
```

```
[yapyak] ↻ "Save changes" → "Save" (rename detected, reusing translations)
```

The Swedish "Spara ändringar"? Still there. Just under a new key. Click around — works exactly as before. No agent round-trip needed. Cookie unchanged.

Why position-based and not similarity-based? Because **position is exact**. "Save" and "Cave" have a 75% Levenshtein similarity. They're not the same message. Position match is unambiguous: same place in your code, you renamed it, period. False positives don't happen.

The cache lives in `node_modules/.cache/yapyak/positions.json`. You never touch it. It just makes the right thing happen, silently, every save.

This is the kind of feature you don't notice until you don't have it — and then you notice it screaming.

### Refactor across files — translations follow

Position-aware memory handles renames *within a file*. But what happens when you refactor across files? Move `t('Save')` from `OldDialog.tsx` to a new shared `Button.tsx`. Or rename `payment-dialog.tsx` to `confirm-dialog.tsx`. Different file, different lookup key — surely the translation is lost?

```
[yapyak] reused 1 translation from other files → sv
```

Nope. yapyak's watcher searches every locale file for the same source string in any other file. If it finds one, it copies the translation forward. Zero agent calls. Refactor freely — your translations migrate with the code.

Two `t('Save')` calls in different files want *different* translations? Edit the JSON to customize either one (or ask the agent to). The cross-file lookup only fills in *missing* entries; it never overrides what's already there. Component-scoped customization stays customized.

This is the feature that makes source-string-as-key viable in a 100-route app where things move around constantly.

### The translation editor that lives where your app does

Here's the part where most i18n libs hand you off: install our cloud, log in to our portal, navigate to your project, find the message, edit, push back. Cool. Have you tried not doing all that?

yapyak ships a translation editor as part of the Vite dev plugin. Set `overlay: true` and a 🐃 button appears bottom-right of your dev page. Click it. A side panel slides in. Every translation in your app, searchable, editable, with stats and an "On this page" filter that updates as you navigate.

What you can do without leaving the page:

- **Edit any translation in place.** Type the new value, hit Save. JSON updates, HMR pushes the new string into the running app, no reload.
- **Preview as locale.** Dropdown switches the page to render in any locale. Overrides the cookie. Close the overlay → back to the user's actual locale. DevTools, not state-management.
- **See completion at a glance.** "EN 27/27 · SV 24/27" header tells you what's incomplete in this app, right now.
- **Open in editor.** Click any file path → opens VSCode/Cursor at the right line.

For everything else — bulk fills, AI re-translation, glossary work — you talk to your agent. The overlay deliberately doesn't compete with that. It's for the things you do faster by hand than by typing a sentence to a chatbot.

The whole thing lives inside Shadow DOM. It can't fight with your app's CSS, it can't be fought back. When you don't need it: closed, invisible, zero overhead. When you do: there, exactly where you need it.

Off by default. Set `overlay: true` to enable. Dev-only — never ships in production builds.

### Per-message tree-shaking

Most i18n libraries ship every translation for every locale to every page. Yapyak doesn't.

Each `t('...')` call is rewritten at build time to a direct reference to a tree-shakable function in a virtual `yapyak/messages` module:

```ts
// You write:
{t('Welcome home')}

// What ends up in the bundle:
{_m_a3f8b2c1d4e5()}

// What `_m_a3f8b2c1d4e5` looks like in the generated module:
export const _m_a3f8b2c1d4e5 = (p) => ({
  en: () => 'Welcome home',
  sv: () => 'Välkommen hem',
})[getLocale()]();
```

Each message is its own top-level export. Vite/Rollup tree-shake at module level: route `/checkout` only references the messages it actually uses, so only those messages' bodies end up in the route's chunk. Unused translations? Gone. Even unused locales for the messages that *are* used? Inlined alongside, but the rest of the message graph is dropped.

App with 1000 messages × 5 locales, route uses 20 messages: the route loads 20 inlined functions, not 5000.

Same architectural advantage as Paraglide's tree-shaking — but you keep writing source-string-as-key. No `m.greeting()` indirection, no JSON-to-ID translation table to maintain. Best of both worlds.

### Component-discriminated translations

Same English string, two contexts, two different translations. The classic example: `t('Save')` on a form button means "submit the form" (Swedish: *Spara*); `t('Save')` on a contract action means "preserve to disk" (Swedish: *Bevara*). Same English, different intent.

Most i18n libraries make you invent unique IDs to distinguish: `m.form_save` vs `m.action_save`. Manual, error-prone, ugly. yapyak does it automatically: each `t()` call's hash is `(fileId, source)`, so the same English in two files produces two independent entries. Edit either translation in the JSON without affecting the other.

```json
// locales/sv.json
{
  "src/components/employee-form.tsx": { "Save": "Spara" },
  "src/components/contract-actions-bar.tsx": { "Save": "Bevara" }
}
```

You don't think about it. You write `t('Save')` everywhere. yapyak handles the rest. The agent reading via `read_message` gets the file path and component name in the response, so it can disambiguate without you ever annotating anything.

### Built on AOT-compiled ICU

Translations get compiled to JavaScript functions ahead of time — no runtime parser, no MessageFormat library shipping in your bundle. Plurals, selects, named placeholders, exact match — all the standard stuff:

```tsx
t('You have {count, plural, one {# message} other {# messages}}', { count: 3 })
// "You have 3 messages"

t('{name, select, joakim {Hej} other {Hello}}, {greeting}', {
  name: 'joakim',
  greeting: 'world',
})
// "Hej, world"
```

Each unique `(file, source)` pair becomes its own tree-shakable function with all locales inlined as a switch. Routes pull in only the messages they reference. ICU plural rules use `Intl.PluralRules`. No runtime ICU parser ships. 🐃

### Multi-framework, one plugin

Same Vite plugin, four `framework` flavours. Each gets its own idiomatic API:

```ts
// React
yapyak({ framework: 'react' });

import { IntlProvider, useLocale, t } from 'yapyak';
function App() {
  const [locale, setLocale] = useLocale();
  return <h1>{t('Hello')}</h1>;
}
```

```vue
<!-- Vue -->
<!-- yapyak({ framework: 'vue' }) -->
<script setup lang="ts">
import { t, useLocale } from 'yapyak';
const locale = useLocale();
</script>
<template><h1>{{ t('Hello') }}</h1></template>
```

```svelte
<!-- Svelte -->
<!-- yapyak({ framework: 'svelte' }) -->
<script lang="ts">
  import { locale, t } from 'yapyak';
</script>
<h1>{t('Hello')}</h1>
<button onclick={() => (locale.current = 'sv')}>SV</button>
```

```ts
// Runtime-free (Node CLI, server-only, embedded)
yapyak({ framework: null });

import { t, getLocale, setLocale, subscribe } from 'yapyak';
console.log(t('Hello'));
```

The runtime singleton is the same; only the framework binding differs. Switch `framework` and the generated module switches with you — no changes to your `t()` calls.

---

## Comparison

Receipts at the bottom — these aren't vibes, they're verified against each library's actual docs as of May 2026 (Paraglide v2, Lingui v6, next-intl 4.0, etc.).

Legend: ✅ shipped and idiomatic · ⚠️ partial / requires opt-in / clunky · ❌ not supported

| Feature                                | yapyak | next-intl | react-intl | i18next | lingui | paraglide | tolgee | languine |
|----------------------------------------|--------|-----------|------------|---------|--------|-----------|--------|----------|
| Source-string-as-key                   |   ✅    |     ❌     |     ❌      |    ❌    |   ⚠️    |     ❌     |    ❌   |    ❌     |
| Per-message tree-shaking               |   ✅    |     ❌     |     ❌      |    ❌    |   ❌    |     ✅     |    ❌   |   N/A    |
| Component-discriminated (auto)         |   ✅    |     ❌     |     ❌      |    ❌    |   ⚠️    |     ❌     |    ❌   |    ❌     |
| AOT-compiled messages                  |   ✅    |     ❌     |     ⚠️      |    ❌    |   ✅    |     ✅     |    ❌   |   N/A    |
| Type-safe params from source           |   ✅    |     ⚠️     |     ❌      |    ⚠️    |   ⚠️    |     ✅     |    ❌   |   N/A    |
| Autocomplete on `t()` calls            |   ✅    |     ⚠️     |     ❌      |    ⚠️    |   ❌    |     ✅     |    ❌   |   N/A    |
| **MCP server for agent translation**   |   ✅    |     ❌     |     ❌      |    ❌    |   ❌    |     ❌     |    ❌   |    ❌     |
| Agent-readable call-site context       |   ✅    |     ❌     |     ❌      |    ❌    |   ❌    |     ❌     |    ❌   |    ❌     |
| Watcher syncs locale stubs             |   ✅    |     ❌     |     ❌      |    ❌    |   ❌    |     ❌     |    ❌   |    ❌     |
| Position-aware rename memory           |   ✅    |     ❌     |     ❌      |    ❌    |   ❌    |     ❌     |    ❌   |    ⚠️     |
| Cross-file translation reuse           |   ✅    |     ❌     |     ❌      |    ❌    |   ❌    |     ❌     |    ❌   |    ❌     |
| Zero-config SSR                        |   ✅    |     ⚠️     |     ❌      |    ❌    |   ❌    |     ✅     |    ❌   |   N/A    |
| Multi-framework (React/Vue/Svelte)     |   ✅    |     ❌     |     ⚠️      |    ✅    |   ✅    |     ✅     |    ✅   |   N/A    |
| Inline dev overlay (in-page edit)      |   ✅    |     ❌     |     ❌      |    ❌    |   ❌    |     ❌     |    ⚠️   |    ❌     |
| One package                            |   ✅    |     ✅     |     ❌      |    ❌    |   ❌    |     ✅     |    ❌   |    ✅     |
| Minimal API surface                    |   ✅    |     ⚠️     |     ❌      |    ❌    |   ⚠️    |     ✅     |    ❌   |    ✅     |
| No vendor lock-in for translation work |   ✅    |     ✅     |     ✅      |    ✅    |   ✅    |     ✅     |    ❌   |    ⚠️     |

**The receipts:**

- **next-intl** uses abstract keys (`t('home.welcome')`), no AOT, requires Next-specific routing/middleware setup. Type augmentation is opt-in. ([docs](https://next-intl.dev/docs/usage/configuration))
- **react-intl** is the FormatJS suite — multiple packages (`@formatjs/*`), abstract message IDs, verbose `<FormattedMessage>` API.
- **i18next** is the everywhere-default and shows it: `i18next` + `react-i18next` + `i18next-resources-to-backend` + plugins. Abstract keys. Type-safety is bolted on via TS augmentation.
- **lingui v6** (April 2026) shipped agent-oriented [Lingui Skills](https://github.com/lingui/skills) — but skills are prompt bundles, not tools. The agent still doesn't get programmatic access to your message graph. Source-string-as-key is supported but auto-generates short hash IDs by default (e.g. `"nwR43V"`); raw source IDs require opt-in. File-scoping needs manual `context=`. ([release notes](https://lingui.dev/blog/2026/04/22/announcing-lingui-6.0))
- **paraglide v2** (inlang) is the closest peer on the compiler axis — tree-shakeable, AsyncLocalStorage SSR, single package. But messages are abstract keys (`m.greeting()`), no MCP, no rename detection. ([repo](https://github.com/opral/paraglide-js))
- **tolgee** has built-in AI translation — but it lives in their cloud platform, not the library. The library itself is essentially i18next under the hood, and the AI is locked to their billing. ([features](https://tolgee.io/features/ai-translation))
- **languine** is a CLI tool that AI-translates JSON files via git diff. Not a library — runs separately, no runtime, no MCP, no autocomplete, no SSR concerns. Position-aware ⚠️ via git-diff but not real rename detection. ([repo](https://github.com/languine-ai/languine))

**yapyak is the only library that ships an MCP server with translation tools.** No one else exposes call-site context to your agent programmatically. No one else combines source-string-as-key with per-message tree-shaking. No one else has cross-file translation reuse. The closest peer on tooling is Paraglide; the closest peer on agent-orientation is Lingui Skills. Neither does both, and neither speaks MCP.

---

## API

### `yapyak()` plugin options

```ts
yapyak({
  framework: 'react',              // 'react' | 'vue' | 'svelte' | null (default: null = runtime-free)
  adapter: 'tanstackStart',        // 'tanstackStart' | 'sveltekit' | null — auto-wires SSR cookie reading
  defaultLocale: 'en',
  locales: ['en', 'sv', 'de'],
  localesDir: 'locales',           // where translations live
  persistence: 'cookie',           // 'cookie' | 'localStorage' | null (default: null)
  acceptLanguage: true,            // fall back to Accept-Language header
  overlay: true,                   // inline dev overlay (default: false)
})
```

That's the entire surface. No `ai`, no `provider`, no `apiKey`. The translation work is the agent's job.

### Runtime API

```ts
import {
  t,                  // translate (replaced by transform with a tree-shakable function)
  setLocale,          // change locale + persist (cookie / localStorage / nothing)
  useLocale,          // [locale, setLocale] for React, computed ref for Vue
  getLocale,          // current locale (server or client)
  IntlProvider,       // React: wraps your app
  locale,             // Svelte: { current: string } — read/write reactive
} from 'yapyak';
```

### CLI

```bash
yapyak init                  # scaffold locales/ + tsconfig
yapyak extract               # one-shot sync of JSON files with code (the watcher does this live)
yapyak compile               # build static locale modules
yapyak check [--write]       # validate (--write to prune stale)
yapyak status [--json]       # report missing translations
yapyak mcp                   # run the MCP server (used by .mcp.json)
```

### MCP tools

These are the tools your agent sees once `.mcp.json` is wired up. You don't call them yourself — your agent does.

| Tool                  | Purpose                                                                              |
|-----------------------|--------------------------------------------------------------------------------------|
| `get_config`          | Returns `defaultLocale`, `locales`, `localesDir`, `source` patterns.                 |
| `list_messages`       | All translatable strings + current state across every locale.                        |
| `list_missing`        | Filter to what's untranslated. Optional `locale` arg.                                |
| `read_message`        | Single message by hash with file, component, line, snippet, parent JSX, attribute.   |
| `write_translation`   | Single atomic write to one locale.                                                   |
| `write_translations`  | Batched writes — multiple updates merged into one file write per locale.             |
| `remove_translation`  | Remove an entry so it falls back to "missing".                                       |
| `prune_stale`         | Remove all entries whose source no longer exists in code. Equivalent to `--write`.   |
| `validate`            | Returns `{ issues, autoFixableCount }`. Stale issues carry `autoFixable: true`.      |

---

## Status

Early — but the architecture is settled. Vite plugin works for React (TanStack Start, vanilla), Vue (vanilla), Svelte (vanilla, SvelteKit), and runtime-free (CLI, server-only). MCP server tested with Claude Code. Adapters for Remix and Astro coming as people ask.

The big features are all in:

- Per-message tree-shaking with source-string-as-key
- Built-in MCP server with nine tools, no extra dependencies
- Component-discriminated translations
- Cross-file rename stability
- Position-aware in-file rename memory
- Watcher that syncs locale stubs on every save
- Inline dev overlay with live edit + locale preview
- Multi-framework support
- Auto-wired SSR adapters

What's left before `v1.0`: real-world usage, edge cases, doc polish, API freeze. We've moved a lot in the last few weeks; we want a `v0.x` series of feedback before locking the surface.
