---
title: Configuration
order: 4
---

yapyak reads its configuration from `yapyak.config.ts` at your project root. Every field is optional, and each one belongs to one part of what yapyak does: your locales, the code it scans, the translation that fills your stubs, and the runtime in the browser.

{% switch group="framework" %}

{% when value="react" %}
```ts [yapyak.config.ts]
import { react } from '@yapyak/react/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  processors: [react()]
});
```
{% /when %}

{% when value="vue" %}
{% switch group="adapter" %}
{% when value="none" %}
```ts [yapyak.config.ts]
import { vue } from '@yapyak/vue/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  processors: [vue()]
});
```
{% /when %}
{% when value="nuxt" %}
```ts [yapyak.config.ts]
import { nuxt } from '@yapyak/nuxt/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  processors: [nuxt()]
});
```
{% /when %}
{% /switch %}
{% /when %}

{% when value="svelte" %}
```ts [yapyak.config.ts]
import { svelte } from '@yapyak/svelte/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  processors: [svelte()]
});
```
{% /when %}

{% when value="astro" %}
```ts [yapyak.config.ts]
import { astro } from '@yapyak/astro/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  processors: [astro()]
});
```
{% /when %}

{% /switch %}

## Quick reference

| Field | Default | What it sets |
|---|---|---|
| [`defaultLocale`](#defaultlocale) | `'en'` | Your source language |
| [`localesDir`](#localesdir) | `'locales'` | Where locale files live |
| [`include`](#include) | `['.']` | Which files yapyak scans |
| [`exclude`](#exclude) | tests, generated files, `.d.ts` | Which files it skips |
| [`processors`](#processors) | `[]` | Framework file formats |
| [`translator`](#translator) | none | The model that fills stubs |
| [`autoTranslateThreshold`](#autotranslatethreshold) | `20` | New strings per save before the translator holds off |
| [`preserveTranslationsOnSourceEdit`](#preservetranslationsonsourceedit) | depends on translator | Keep a translation when a source string is edited |
| [`persistence`](#persistence) | `'none'` | Where the active locale is stored |
| [`detectUserLocale`](#detectuserlocale) | `false` | Detect the first-visit locale |
| [`syncHtmlAttributes`](#synchtmlattributes) | `false` | Keep `<html lang>` and `<html dir>` in sync |

## Locales

The fields that define your set of languages and where they live on disk.

### `defaultLocale`

Your source language: the locale you write your `t()` calls in. yapyak uses it as the source for [translator](#translator) requests, and as the final [fallback](/guide/switching/tags) when no other locale matches. Set it only if you author in something other than English.

```ts
defaultLocale: 'sv',
```

**Type**: [`Locale`](/reference/yapyak/Locale) · **Default**: `'en'`

### `localesDir`

Where yapyak reads and writes [locale files](/guide/getting-started/how-it-works#locale-files), relative to the project root. One JSON file per locale.

```ts
localesDir: 'src/i18n/messages',
```

**Type**: `string` · **Default**: `'locales'`

### The set of locales

Which locales your app ships is not a config field. yapyak reads it from the JSON files in your `localesDir`, one file per locale, each named after its [BCP 47 tag](/guide/switching/tags). Adding a locale means adding a file, which the CLI does for you:

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

The CLI creates `locales/sv.json`, fills any existing source strings through your translator, and regenerates the `Locale` type. See [`yapyak add`](/reference/cli/add).

## Extraction

The fields that control which files yapyak scans for `t()` calls.

### `include`

Which files to scan. Defaults to every source file under the project root; dot directories and the [`exclude`](#exclude) patterns are skipped. Set it to narrow extraction to part of the tree:

```ts
include: ['apps/web', 'packages/ui/src'],
```

Each entry is a directory name, a glob, or a `RegExp`. A bare directory name expands to every source file inside it, across the extensions your [processors](#processors) handle. Setting the field replaces the default.

**Type**: [`FilterPattern`](/reference/yapyak/config/FilterPattern) · **Default**: `['.']`

### `exclude`

Which files to skip. Same shape as `include`. Tests, generated files, `.d.ts` declarations, `node_modules`, and build output are skipped by default:

```ts
exclude: [
  '**/*.{test,spec}.*',
  '**/__tests__/**',
  '**/*.{stories,gen}.{ts,tsx,js,jsx,mjs,cjs}',
  '**/*.d.ts',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/yapyak.config.*'
],
```

Setting `exclude` replaces this list rather than adding to it. To extend it, spread `DEFAULT_EXCLUDE` from `yapyak/config`:

```ts
import { defineConfig, DEFAULT_EXCLUDE } from 'yapyak/config';

export default defineConfig({
  exclude: [...DEFAULT_EXCLUDE, '**/*.vendor.ts']
});
```

`DEFAULT_INCLUDE` is exported the same way.

**Type**: [`FilterPattern`](/reference/yapyak/config/FilterPattern) · **Default**: see above

### `processors`

Framework processors that let yapyak read `.vue`, `.svelte`, `.astro`, or any custom format. The built-in parser handles `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.mjs`, `.cts`, and `.cjs` without one.

```ts
import { react } from '@yapyak/react/processor';
import { vue } from '@yapyak/vue/processor';

processors: [react(), vue()]
```

Register one per framework you use. Each takes responsibility for its own file extensions:

| Framework | Import |
|---|---|
| React | `import { react } from '@yapyak/react/processor'` |
| Vue | `import { vue } from '@yapyak/vue/processor'` |
| Nuxt | `import { nuxt } from '@yapyak/nuxt/processor'` |
| Svelte | `import { svelte } from '@yapyak/svelte/processor'` |
| Astro | `import { astro } from '@yapyak/astro/processor'` |

**Type**: [`Processor[]`](/reference/yapyak/processor/Processor) · **Default**: `[]`

#### React Server Components

The React processor is the only one that takes an option, `rsc`. Turn it on for projects using React Server Components:

```ts
processors: [react({ rsc: true })]
```

With `rsc: true`, only files marked `'use client'` get the locale subscription hook. Server components still have their `t()` calls rewritten; instead of subscribing to the client locale store, they read the request-bound locale from the SSR adapter.

#### Custom processors

For a file format yapyak doesn't ship a processor for, build one with [`createProcessor`](/reference/yapyak/processor/createProcessor) from `yapyak/processor`. It takes:

| Field | Notes |
|---|---|
| `id` | A stable, non-empty identifier. |
| `extensions` | The file extensions to claim. |
| `parseSource` | Optional. Splits your format into TypeScript-readable fragments and reports the parser's diagnostics. |
| `runtime` | Optional. The runtime module yapyak wires into compiled output. |
| `applyImport` | Optional. Controls how imports are injected. |
| `skipHmrCallback` | Optional. For formats whose compiler can't embed Vite HMR callbacks at module scope. Astro's `.astro` files use it. |

`yapyak/processor` also exports [`offsetToOriginalPosition`](/reference/yapyak/processor/offsetToOriginalPosition) and [`rangeFromOffsets`](/reference/yapyak/processor/rangeFromOffsets) for mapping string indices back to `{ line, column }` positions when your parser emits diagnostics. A parser that reports byte offsets converts them first.

## Translation

The fields that control the [translator](/guide/translating/overview) that fills your empty stubs during the [save loop](/guide/getting-started/how-it-works#save-loop).

### `translator`

The model that fills empty stubs on save. yapyak ships translators for Anthropic, OpenAI, Gemini, and Ollama; for anything else, write a [custom translator](/guide/advanced/custom-translator).

```ts
import { anthropic } from '@yapyak/anthropic';

translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
```

Voice, glossary, context, [examples](/guide/translating/examples), batching, concurrency, and model selection are options on the translator itself. See [Translators](/guide/translating/overview).

**Type**: [`Translator`](/reference/yapyak/translator/Translator) · **Default**: none, so stubs stay empty

### `autoTranslateThreshold`

A guardrail for the save loop. When a single save adds more new strings than this, yapyak writes the stubs but holds the translator back, so one large paste doesn't spend an API budget at once. `0` turns auto-translation off entirely; run [`yapyak translate`](/guide/translating/loop) when you're ready.

**Type**: `number` · **Default**: `20`

### `preserveTranslationsOnSourceEdit`

Whether yapyak keeps the existing translation when you edit a source string in place. See [Renames](/guide/translating/renames#same-path-edited-source-string).

**Type**: `boolean` · **Default**: `true` without a translator, `false` with one

## Runtime

The fields baked into the runtime the browser gets. They shape how the [active locale](/guide/switching/overview) is resolved and stored.

### `persistence`

Where the active locale is stored between page loads. Pass a strategy name, or an object for its options:

```ts
persistence: 'cookie',
```

```ts
persistence: {
  name: 'lang',
  type: 'cookie'
},
```

The strategies are `'none'`, `'cookie'`, `'local-storage'`, and `'url'`. See [Persistence](/guide/switching/persistence) for each one's options.

**Type**: [`PersistenceConfig`](/reference/yapyak/config/PersistenceConfig) · **Default**: `'none'`

### `detectUserLocale`

Whether to detect the locale from the environment on a first visit, when no [persisted](#persistence) value exists. On the server it reads the `Accept-Language` header; in the browser it reads `navigator.languages`. The detected value is matched against your locales, and falls through to [`defaultLocale`](#defaultlocale) if none match. A persisted choice always wins.

```ts
detectUserLocale: true,
```

**Type**: `boolean` · **Default**: `false`

### `syncHtmlAttributes`

Whether to keep `<html lang>` and `<html dir>` in sync with the active locale on every switch. The direction comes from the locale's script: `rtl` for Arabic, Hebrew, Persian, Urdu, and the other right-to-left scripts; `ltr` otherwise. The same value is available as [`getTextDirection`](/reference/yapyak/getTextDirection) for rendering the attributes server-side.

```ts
syncHtmlAttributes: true,
```

Turn it on for SPA frameworks and for Astro projects that switch locale through client-side islands. Leave it off when your layout sets the attributes itself, such as `<html lang={getLocale()} dir={getTextDirection(getLocale())}>` in an Astro layout that re-renders on navigation.

**Type**: `boolean` · **Default**: `false`

## Config at runtime

You set `yapyak.config.ts` once. To read what you configured at runtime, for a locale switcher say, import from `yapyak`:

```ts
import { defaultLocale, getLocale, locales } from 'yapyak';
```

`locales` and `defaultLocale` reflect your config; `getLocale()` returns the active locale. See [Switch](/guide/switching/switch) for the rest of the runtime API.
