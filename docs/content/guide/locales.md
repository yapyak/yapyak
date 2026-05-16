---
title: Locales
order: 5
---

Locales are configured implicitly. The default lives in your code; the others live as files in `locales/`.

## Auto-discovery

yapyak doesn't ask you to list locales in `vite.config.ts`. Whatever JSON files exist in `locales/` *are* your non-default locales:

```
locales/
  es.json    ← Spanish locale exists
  fr.json    ← French locale exists
  de.json    ← German locale exists
```

Implicit configuration: `defaultLocale: 'en'`, `locales: ['en', 'es', 'fr', 'de']`. Add a file, get a new locale. Delete a file, lose it.

The default locale (`en` by default) doesn't need a file because your source code is the file.

## The default locale

You can override the default in `vite.config.ts`:

```ts
yapyak({
  defaultLocale: 'sv',   // Swedish-default project
  // ...
})
```

When the default isn't `en`, you write `t('Spara ändringar')` directly. Other locales (including English, if you want it) translate from Swedish.

If `defaultLocale` is unset, yapyak uses `'en'`.

## Reading the current locale

```ts
import { getLocale } from 'yapyak';

getLocale()   // 'es'
```

Same import on the server and client. On the server, the locale is resolved per request via the SSR adapter (cookie + `Accept-Language` header). On the client, it's read from the runtime store.

## Reading all configured locales

```ts
import { getLocales, getDefaultLocale } from 'yapyak';

getLocales()         // ['en', 'es', 'fr', 'de']
getDefaultLocale()   // 'en'
```

`getLocales()` returns the default locale plus every JSON file in `locales/`. Useful for building locale switchers.

## Switching locale

```ts
import { setLocale } from 'yapyak';

setLocale('es');
```

Updates the in-memory store, persists according to your `persistence` config, and notifies all subscribed `useLocale` hooks. Components re-render in the new locale.

In components, use the framework-idiomatic reactive binding so the UI re-renders on locale change:

::: code-group

```tsx [React]
import { getLocales } from 'yapyak';
import { useLocale } from 'yapyak/react';

export function LocaleToggle() {
  const [locale, setLocale] = useLocale();
  return (
    <select value={locale} onChange={(event) => setLocale(event.target.value)}>
      {getLocales().map((code) => (
        <option key={code} value={code}>{code.toUpperCase()}</option>
      ))}
    </select>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { getLocales } from 'yapyak';
import { locale } from 'yapyak/vue';
</script>

<template>
  <select v-model="locale">
    <option v-for="code in getLocales()" :key="code" :value="code">
      {{ code.toUpperCase() }}
    </option>
  </select>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { getLocales } from 'yapyak';
  import { locale } from 'yapyak/svelte';
</script>

<select bind:value={locale.current}>
  {#each getLocales() as code}
    <option value={code}>{code.toUpperCase()}</option>
  {/each}
</select>
```

:::

The framework-specific exports (`yapyak/react`, `yapyak/vue`, `yapyak/svelte`) only differ in *how* you read and write the locale reactively — the `t` function itself is the same import everywhere.

## Persistence

The user's locale choice can be persisted in three ways:

```ts
yapyak({
  persistence: 'cookie',         // SSR-safe (recommended)
  // OR
  persistence: 'localStorage',   // SPA-only
  // OR
  persistence: null,             // in-memory, refresh resets (default)
})
```

### Cookie

The right choice for SSR apps. Sent with every request, so the server can read it and pre-render in the user's locale. The cookie is written client-side on `setLocale()`, with `path=/`, `samesite=lax`, `max-age=1y`.

Customize the cookie name:

```ts
yapyak({
  persistence: 'cookie',
  cookieName: 'app-locale',   // default: 'locale'
})
```

### localStorage

For pure SPAs (no SSR) or apps avoiding cookie banners (localStorage is exempt from EU cookie-consent rules in most jurisdictions).

Tradeoff: server can't read it. First paint always renders in the default locale; the client swaps to the user's locale after hydration. Brief flash possible.

```ts
yapyak({
  persistence: 'localStorage',
  storageKey: 'app:locale',   // default: 'yapyak:locale'
})
```

### `null` (default)

No persistence. Refresh resets to the default locale. Useful for ephemeral sessions, demos, or when another mechanism (e.g. a session API) handles persistence.

## SSR detection

When `persistence: 'cookie'` is set *and* an SSR adapter is wired ([TanStack Start](/guide/adapters/tanstack-start), [SvelteKit](/guide/adapters/sveltekit), or [custom](/guide/adapters/custom)), the locale resolves per request through this cascade:

1. **Cookie** (the user's explicit choice) — highest priority
2. **`Accept-Language` header** (browser/OS preference) — if `acceptLanguage: true`
3. **Default locale** (configured fallback)

Each request picks the right locale before HTML renders. `getLocale()` returns the per-request value; `t()` calls in SSR render in that locale; the cookie matches what the client reads, so there's no hydration mismatch.

To opt into `Accept-Language` matching:

```ts
yapyak({
  persistence: 'cookie',
  acceptLanguage: true,   // default: false
})
```

Off by default because it adds a dependency on header parsing semantics; on for apps that want browser-language detection out of the box.

## Locale codes

yapyak treats locale codes as opaque strings. Whatever you name a file in `locales/` becomes a locale.

Common conventions:

- ISO 639-1: `en`, `es`, `fr`, `de`, `ja`
- BCP 47 regional: `en-US`, `en-GB`, `pt-BR`, `zh-Hant`
- Custom: `pseudo`, `qa`, `internal` for testing

Regional tags work end-to-end. `Intl.PluralRules` and `Intl.DateTimeFormat` get the full tag for region-aware formatting.

```bash
npx yapyak add pt-BR es-MX zh-Hant
# or
pnpm yapyak add pt-BR es-MX zh-Hant
```

### Regional vs language

`pt-BR` and `pt` are two separate locales. Configure both if you ship both. There's no runtime fallback from one to the other.

`Accept-Language` matching during SSR detection is the one place tags collapse. A regional header against a language-code locale matches on the prefix:

| Configured locales | `Accept-Language` | `getLocale()` returns |
|---|---|---|
| `['en', 'pt']` | `pt-BR,en;q=0.9` | `pt` |
| `['en', 'pt-BR']` | `pt-BR,en;q=0.9` | `pt-BR` |
| `['en', 'pt-BR']` | `pt,en;q=0.9` | `en` |
| `['en', 'sv']` | `de-DE,fr;q=0.9` | `en` |

One direction only. Header `pt-BR` resolves to locale `pt`. Header `pt` does not resolve to locale `pt-BR`.

This follows RFC 4647 Lookup. The requested tag truncates from the right until a match is found. Expanding `pt` to `pt-BR` would mean guessing a region the user did not request.

The cookie wins over `Accept-Language` either way.

## Default-locale fallback

When a translation is missing or empty for a target locale, the runtime renders the source string.

```tsx
t('A new untranslated string')
// Rendered as 'A new untranslated string' in es, fr, de, etc.
// until a translation lands.
```

Both states resolve to the source: a key absent from `locales/*.json`, and a key present with `""`. A half-finished AI run leaves stubs as `""`, and those stubs render the source until the next save fills them in.
