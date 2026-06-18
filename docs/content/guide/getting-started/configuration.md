---
title: Configuration
order: 3
---

`yapyak.config.ts` is yapyak's central configuration. It tells the build which files to scan, how to translate missing entries, and how the runtime should behave. The set of locales your app ships isn't a config field — it comes from the JSON files in your [`localesDir`](#localesdir). Every config field is optional — yapyak has defaults for everything — but you'll set a handful explicitly in any real project.

This page documents every field. Read it once when you set up a project, then dip back into it when you need to look up a specific option.

## Quick reference

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  // Source files
  include: ['src'],                       // patterns to scan
  exclude: [/* ... */],                   // patterns to skip (defaults cover tests, .d.ts, stories, gen)
  processors: [/* ... */],                // framework processors

  // Locales
  defaultLocale: 'en',                    // source language
  localesDir: 'locales',                  // where locale JSON files live

  // Translator
  translator: /* ... */,                  // optional LLM
  examples: 5,                            // in-context style examples per request
  autoTranslateThreshold: 20,             // skip auto-translate above this many new strings on save
  preserveTranslationsOnRename: true,     // keep existing translations on source edits

  // Runtime
  persistence: 'none',                    // 'none' | 'cookie' | 'url' | 'local-storage'
  syncHtmlLang: false,                    // sync <html lang> on locale change
  detectAcceptLanguage: false,            // detect locale from Accept-Language header
});
```

Every field is optional — the values above are the defaults. Each field is documented in detail below. The full type lives in `yapyak/config`, and your editor will autocomplete every option.

## Locales

### `defaultLocale`

The locale yapyak falls back to when nothing else has resolved the active one. Used as the source language for [translator](/guide/translators/overview) requests and as the fallback at the end of a [BCP 47 fallback chain](/guide/locale/tags). Defaults to `'en'` — set this only if your source language is something else:

```ts
defaultLocale: 'sv',
```

**Type**: `Locale` · **Default**: `'en'`

### The set of locales

The list of locales your app ships isn't a config field. yapyak reads it from the JSON files in your [`localesDir`](#localesdir) — one file per locale, named after its [BCP 47 tag](/guide/locale/tags). Adding a locale means adding a file:

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
pnpm yapyak add sv
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak add sv
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak add sv
```
{% /when %}
{% /switch %}

The CLI creates `locales/sv.json`, fills any existing source strings through your translator, and regenerates the `Locale` literal type. See [`yapyak add`](/guide/cli/add).

## Source files

Two fields control which files yapyak scans for `t()` calls.

### `include`

Patterns yapyak should scan. Each entry can be:

- A bare directory name like `'src'`, which expands to every source file inside it (extensions depend on your processors)
- A glob like `'app/**/*.tsx'`
- A `RegExp`

```ts
include: ['src', 'app/components'],
```

**Type**: `FilterPattern` · **Default**: `['src']`

### `exclude`

Patterns yapyak should skip. Same shape as `include`. Tests, generated files, and `.d.ts` declarations are excluded by default:

```ts
// Default exclude list (you don't need to write this)
exclude: [
  '**/*.{test,spec}.*',
  '**/__tests__/**',
  '**/*.{stories,gen}.{ts,tsx,js,jsx,mjs,cjs}',
  '**/*.d.ts',
],
```

If you set `exclude` yourself, you're replacing the defaults, not adding to them. Re-list anything you want to keep excluded.

**Type**: `FilterPattern` · **Default**: see above

## Processors

Framework-specific processors that teach yapyak how to read `.vue`, `.svelte`, `.astro`, or any custom format. The built-in TypeScript/JavaScript parser handles `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.mjs`, `.cts`, and `.cjs` without one.

### `processors`

```ts
import { react } from '@yapyak/react/processor';
import { vue } from '@yapyak/vue/processor';

processors: [react(), vue()],
```

If your project mixes frameworks, register all of them — each processor takes responsibility for its own file extensions. The factories live in their respective binding packages:

| Framework | Import |
|---|---|
| React | `import { react } from '@yapyak/react/processor'` |
| Vue | `import { vue } from '@yapyak/vue/processor'` |
| Svelte | `import { svelte } from '@yapyak/svelte/processor'` |
| Astro | `import { astro } from '@yapyak/astro/processor'` |

**Type**: `Processor[]` · **Default**: `[]` (TS/JS only)

#### React Server Components

The React processor is the only one that takes an option — `rsc: boolean`. Turn it on for projects using React Server Components:

```ts
processors: [react({ rsc: true })],
```

With `rsc: true`, only files marked `'use client'` get the locale subscription hook injected. Server components still have their `t()` calls rewritten, but they read the request-bound locale from the SSR adapter instead of subscribing to a store.

## Translator

Hook up an LLM to fill in missing translations automatically. yapyak ships translators for Anthropic, OpenAI, Gemini, and Ollama; any LLM with a chat completion endpoint is one short [custom translator](/guide/translators/custom) away.

### `translator`

```ts
import { anthropic } from '@yapyak/anthropic';

translator: anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}),
```

See [Translators](/guide/translators/overview) for the full set of options each provider supports — voice, glossary, context, batching, concurrency, model selection, and more.

**Type**: `Translator` · **Default**: `undefined` (stubs stay empty)

### `examples`

How many existing translations from your project yapyak sends to the model as in-context style examples for each request. More examples nudge the model toward the voice it's already used; too many add latency and cost.

```ts
examples: 5,
```

**Type**: `number` · **Default**: `5` (or `0` when the translator is configured with `context: 'none'`)

### `autoTranslateThreshold`

A guardrail for development. When a single save introduces more new strings than this number, yapyak writes the stubs but holds off on translating them automatically — you can run [`yapyak translate`](/guide/cli/translate) when you're ready. The default catches large refactors or AI-generated additions that would otherwise burn through your API budget in one save.

```ts
autoTranslateThreshold: 20,  // default
autoTranslateThreshold: 0,   // disable automatic translation entirely
```

**Type**: `number` · **Default**: `20`

### `preserveTranslationsOnRename`

When you edit a source string in place (rename `'Save'` to `'Save changes'`), should yapyak keep the existing translation or treat the new wording as a new string?

```ts
preserveTranslationsOnRename: true,  // keep existing
preserveTranslationsOnRename: false, // re-translate
```

**Type**: `boolean` · **Default**: `true` without a translator, `false` with one. With a translator, the default favours accuracy: a wording change usually deserves a fresh translation. Without one, the default favours stability: a manually-written translation shouldn't disappear because of a small edit.

See [Renames](/guide/advanced/renames) for the heuristics in detail.

## Persistence

Where the active locale lives between page loads.

### `persistence`

```ts
persistence: 'cookie',         // shorthand
persistence: { type: 'cookie', name: 'lang' },  // with options
```

Four strategies are available: `'none'`, `'cookie'`, `'local-storage'`, and `'url'`. Each one can be passed as a shorthand string or as a config object with strategy-specific options.

**Type**: `PersistenceConfig` · **Default**: `'none'`

See [Persistence](/guide/locale/persistence) for the full options of each strategy.

### `syncHtmlLang`

Whether yapyak should keep `<html lang>` in sync with the active locale as the user switches.

```ts
syncHtmlLang: true,
```

Turn it on for SPA frameworks (React, Vue, Svelte) and for Astro projects that switch locale through client-side islands. Leave it off when your layout reads the locale itself (e.g. `<html lang={getLocale()}>` in an Astro layout that re-renders on full navigations).

**Type**: `boolean` · **Default**: `false`

### `detectAcceptLanguage`

On the server, whether to detect the user's locale from the `Accept-Language` request header when no persisted value is found.

```ts
detectAcceptLanguage: true,
```

Useful for first-visit defaulting. The detected locale is matched against your configured `locales`; if none match, the request falls through to `defaultLocale`.

**Type**: `boolean` · **Default**: `false`

## Files on disk

### `localesDir`

Where yapyak reads and writes locale JSON files. Relative to the project root.

```ts
localesDir: 'locales',           // default
localesDir: 'src/i18n/messages', // somewhere else
```

The directory contains one JSON file per locale — `en.json`, `sv.json`, and so on. Each file is keyed by source file path and message text. See [How it works](/guide/getting-started/how-it-works) for the structure.

**Type**: `string` · **Default**: `'locales'`

## Fixed-locale builds

When you want a single-locale artifact — a static deploy that serves one language per build — pass `fixedLocale` to the Vite plugin (not `yapyak.config.ts`):

```ts [vite.config.ts]
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({ fixedLocale: 'sv' }),
  ],
});
```

You can also drive it from the environment, useful for CI matrix builds:

```bash
YAPYAK_LOCALE=sv pnpm build
```

In a fixed-locale build, yapyak replaces every eligible `t()` call with the target locale's literal string, tree-shakes the locale picker out of the bundle, and ships no i18n runtime at all. Calls that need runtime behaviour (`t.as()`, ICU placeholders) stay as compiled lookups.

{% callout variant="info" %}
`fixedLocale` lives on the Vite plugin rather than `yapyak.config.ts` because it's a build-time toggle that affects the bundle shape — it isn't something the runtime ever observes.
{% /callout %}

## Reading config from your code

Most of the time you set yapyak.config.ts once and forget about it. If your code needs to know what's configured at runtime — to render a locale switcher, for example — read it from the runtime exports of `yapyak`:

```ts
import { locales, defaultLocale, getLocale } from 'yapyak';
```

`locales` and `defaultLocale` reflect what you set in the config. `getLocale()` returns the active value.

See [Switch](/guide/locale/switch) for the rest of the runtime locale API.
