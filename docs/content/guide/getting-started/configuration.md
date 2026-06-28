---
title: Configuration
order: 3
---

`yapyak.config.ts` at your project root configures yapyak. Every field is optional.

## Quick reference

| Field | Default | Description |
|---|---|---|
| [`include`](#include) | `['src']` | Patterns to scan |
| [`exclude`](#exclude) | tests, `.d.ts`, stories, gen | Patterns to skip |
| [`processors`](#processors) | `[]` | Framework processors |
| [`defaultLocale`](#defaultlocale) | `'en'` | Source language |
| [`localesDir`](#localesdir) | `'locales'` | Where locale files live |
| [`translator`](#translator) | — | Optional model |
| [`examples`](#examples) | `5` | In-context style examples per request |
| [`autoTranslateThreshold`](#autotranslatethreshold) | `20` | Skip auto-translate above N new strings on save |
| [`preserveTranslationsOnRename`](#preservetranslationsonrename) | depends on translator | Keep translations on source edits |
| [`persistence`](#persistence) | `'none'` | Active-locale storage |
| [`syncHtmlLang`](#synchtmllang) | `false` | Sync `<html lang>` on locale change |
| [`detectUserLocale`](#detectuserlocale) | `false` | Detect from `Accept-Language` (server) or `navigator.languages` (browser) |

## Locales

### `defaultLocale`

The locale yapyak falls back to when nothing else has resolved the active one. Used as the source language for [translator](/guide/translating/overview) requests and as the fallback at the end of a [BCP 47 fallback chain](/guide/switching/tags). Defaults to `'en'`. Set this only if your source language is something else:

```ts
defaultLocale: 'sv',
```

**Type**: [`Locale`](/reference/yapyak/Locale) · **Default**: `'en'`

### The set of locales

The list of locales your app ships isn't a config field. yapyak reads it from the JSON files in your [`localesDir`](#localesdir). One file per locale, named after its [BCP 47 tag](/guide/switching/tags). Adding a locale means adding a file:

{% switch group="packageManager" %}
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

The CLI creates `locales/sv.json`, fills any existing source strings through your translator, and regenerates the `Locale` literal type. See [`yapyak add`](/reference/cli/add).

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

**Type**: [`FilterPattern`](/reference/yapyak/config/FilterPattern) · **Default**: `['src']`

### `exclude`

Patterns yapyak should skip. Same shape as `include`. Tests, generated files, and `.d.ts` declarations are excluded by default. The default list:

```ts
exclude: [
  '**/*.{test,spec}.*',
  '**/__tests__/**',
  '**/*.{stories,gen}.{ts,tsx,js,jsx,mjs,cjs}',
  '**/*.d.ts'
],
```

If you set `exclude` yourself, you're replacing the defaults — not adding to them. To extend rather than replace, spread the `DEFAULT_EXCLUDE` constant exported from `yapyak/config`:

```ts
import { defineConfig, DEFAULT_EXCLUDE } from 'yapyak/config';

export default defineConfig({
  exclude: [...DEFAULT_EXCLUDE, '**/*.vendor.ts']
});
```

`DEFAULT_INCLUDE` is exported the same way.

**Type**: [`FilterPattern`](/reference/yapyak/config/FilterPattern) · **Default**: see above

## Processors

Framework-specific processors that parse `.vue`, `.svelte`, `.astro`, or any custom format so yapyak can extract `t()` calls. The built-in TypeScript/JavaScript parser handles `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.mjs`, `.cts`, and `.cjs` without one.

### `processors`

```ts
import { react } from '@yapyak/react/processor';
import { vue } from '@yapyak/vue/processor';

processors: [react(), vue()]
```

If your project mixes frameworks, register all of them. Each processor takes responsibility for its own file extensions. The factories live in their respective binding packages:

| Framework | Import |
|---|---|
| React | `import { react } from '@yapyak/react/processor'` |
| Vue | `import { vue } from '@yapyak/vue/processor'` |
| Svelte | `import { svelte } from '@yapyak/svelte/processor'` |
| Astro | `import { astro } from '@yapyak/astro/processor'` |

**Type**: [`Processor[]`](/reference/yapyak/processor/Processor) · **Default**: `[]` (TS/JS only)

#### React Server Components

The React processor is the only one that takes an option. `rsc: boolean`. Turn it on for projects using React Server Components:

```ts
processors: [react({ rsc: true })]
```

With `rsc: true`, only files marked `'use client'` get the locale subscription hook injected.

Server components still have their `t()` calls rewritten. Instead of subscribing to the client locale store, they read the request-bound locale from the SSR adapter.

#### Custom processors

For file formats yapyak doesn't ship a processor for, build your own with [`createProcessor`](/reference/yapyak/processor/createProcessor) from `yapyak/processor`. The factory takes:

- `id` — a stable, non-empty identifier (convention: lowercase suffix matching the package name)
- `extensions` — file extensions to claim
- `parseFragments` — optional, splits your format into TypeScript-readable pieces
- `runtime` — optional, the runtime module yapyak should wire into compiled output
- `applyImport` — optional, controls how imports are injected
- `skipHmrCallback: true` — optional, for formats whose compiler can't safely embed Vite HMR callbacks at module scope. Astro's `.astro` files use this.

`yapyak/processor` also exports [`offsetToOriginalPosition`](/reference/yapyak/processor/offsetToOriginalPosition) and [`rangeFromOffsets`](/reference/yapyak/processor/rangeFromOffsets) — utilities for converting byte offsets back to `{ line, column }` positions when emitting diagnostics from your processor's fragment parser.

## Translator

Hook up a model to fill in empty stubs automatically. yapyak ships translators for Anthropic, OpenAI, Gemini, and Ollama. For anything else, write a [custom translator](/guide/advanced/custom-translator).

### `translator`

```ts
import { anthropic } from '@yapyak/anthropic';

translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
```

See [Translators](/guide/translating/overview) for the full set of options each provider supports. Voice, glossary, context, batching, concurrency, model selection, and more.

**Type**: [`Translator`](/reference/yapyak/translator/Translator) · **Default**: `undefined` (stubs stay empty)

### `examples`

How many existing translations yapyak sends to the model as in-context style examples per request. See [Examples](/guide/translating/examples).

**Type**: `number` · **Default**: `5` (or `0` when the translator is configured with `context: 'none'`)

### `autoTranslateThreshold`

A guardrail for development. When a single save introduces more new strings than this number, yapyak writes the stubs but holds off on auto-translating. See [Loop](/guide/translating/loop#the-threshold-guardrail).

**Type**: `number` · **Default**: `20`

### `preserveTranslationsOnRename`

Whether yapyak keeps the existing translation when you edit a source string in place. See [Renames](/guide/translating/renames#same-path-edited-source-string).

**Type**: `boolean` · **Default**: `true` without a translator, `false` with one.

## Persistence

Where the active locale lives between page loads.

### `persistence`

Shorthand:

```ts
persistence: 'cookie',
```

With options:

```ts
persistence: {
  name: 'lang',
  type: 'cookie'
},
```

Four strategies are available: `'none'`, `'cookie'`, `'local-storage'`, and `'url'`. Each one can be passed as a shorthand string or as a config object with strategy-specific options.

**Type**: [`PersistenceConfig`](/reference/yapyak/config/PersistenceConfig) · **Default**: `'none'`

See [Persistence](/guide/switching/persistence) for the full options of each strategy.

### `syncHtmlLang`

Keeps `<html lang>` in sync with the active locale on every switch.

```ts
syncHtmlLang: true,
```

Turn it on for SPA frameworks (React, Vue, Svelte) and for Astro projects that switch locale through client-side islands. Leave it off when your layout reads the locale itself (e.g. `<html lang={getLocale()}>` in an Astro layout that re-renders on full navigations).

**Type**: `boolean` · **Default**: `false`

### `detectUserLocale`

Whether to detect the user's locale from the environment when no persisted value is found.

- **On the server:** reads the `Accept-Language` request header.
- **In the browser:** reads `navigator.languages` during runtime initialization.

```ts
detectUserLocale: true,
```

Useful for first-visit defaulting. The detected value is matched against your configured `locales`; if none match, resolution falls through to `defaultLocale`. Detection only runs when no persisted value exists, so a persisted choice (cookie, local-storage, URL) always wins.

**Type**: `boolean` · **Default**: `false`

## Files on disk

### `localesDir`

Where yapyak reads and writes locale files. Relative to the project root.

Default:

```ts
localesDir: 'locales',
```

Custom location:

```ts
localesDir: 'src/i18n/messages',
```

The directory contains one JSON file per locale. `en.json`, `sv.json`, and so on. Each file is keyed by source file path and message text. See [How it works](/guide/getting-started/how-it-works) for the structure.

**Type**: `string` · **Default**: `'locales'`

## Fixed-locale builds

For a single-locale artifact — a static deploy that serves one language per build — pass `fixedLocale` to the Vite plugin (not `yapyak.config.ts`):

```ts [vite.config.ts]
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({ fixedLocale: 'sv' })
  ]
});
```

You can also drive it from an environment variable, useful for CI matrix builds:

```ts [vite.config.ts]
yapyak({ fixedLocale: process.env.YAPYAK_LOCALE })
```

```bash
YAPYAK_LOCALE=sv pnpm build
```

In a fixed-locale build, yapyak replaces every eligible `t()` call with the target locale's literal string, tree-shakes the locale picker out of the bundle, and ships no i18n runtime at all. Calls that need runtime behaviour — `t.as()`, ICU placeholders — stay as compiled lookups.

{% callout variant="info" %}
`fixedLocale` lives on the Vite plugin rather than `yapyak.config.ts` because it's a compile-time toggle that affects the bundle shape. It isn't something the runtime ever observes.
{% /callout %}

## Reading config

Set `yapyak.config.ts` once. If your code needs to read the config at runtime — to render a locale switcher, for example — read it from the runtime exports of `yapyak`:

```ts
import { defaultLocale, getLocale, locales } from 'yapyak';
```

`locales` and `defaultLocale` reflect what you set in the config. `getLocale()` returns the active value.

See [Switch](/guide/switching/switch) for the rest of the runtime locale API.
