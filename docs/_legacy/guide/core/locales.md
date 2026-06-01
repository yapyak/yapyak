---
title: Locales
order: 2
---

Locales are configured implicitly. The default lives in your code; the others live as files in `locales/`.

## Auto-discovery

yapyak doesn't ask you to list locales in `vite.config.ts`. Whatever JSON files exist in `locales/` *are* your non-default locales:

```
locales/
  es.json
  fr.json
  de.json
```

Implicit configuration: `defaultLocale: 'en'`, `locales: ['en', 'es', 'fr', 'de']`. Add a file, get a new locale. Delete a file, lose it.

The default locale doesn't need a file — your source code is the file.

## The default locale

You can override the default in `yapyak.config.ts`:

```ts
import { defineConfig } from 'yapyak';

export default defineConfig({
  defaultLocale: 'sv',   // Swedish-default project
});
```

When the default isn't `en`, you write `t('Spara ändringar')` directly. Other locales (including English, if you want it) translate from Swedish.

If `defaultLocale` is unset, yapyak uses `'en'`.

## Reading and switching the locale

```ts
import {
  getLocale,
  setLocale,
  locales,
  defaultLocale,
  subscribeLocale,
} from 'yapyak';

getLocale();                       // 'es' — currently-active locale
setLocale('sv');                // switch
locales;                        // ['en', 'es', 'fr', 'de'] — all configured
defaultLocale;                  // 'en'
subscribeLocale((locale) => console.log(locale));
```

Same imports on the server and client. On the server, `getLocale()` resolves per request via the SSR adapter (cookie + `Accept-Language` header). On the client, it reads from the runtime store.

## Switching locale

`setLocale(locale)` updates the in-memory store, persists according to your `persistence` config, and notifies framework adapters. Components re-render in the new locale.

In components, import the framework-specific binding so the UI re-renders on locale change:

{% code-group %}

```tsx [React]
import { locales } from 'yapyak';
import { useLocale } from '@yapyak/react';

export function LocaleToggle() {
  const [locale, setLocale] = useLocale();
  return (
    <select value={locale} onChange={(event) => setLocale(event.target.value)}>
      {locales.map((locale) => (
        <option key={locale} value={locale}>{locale.toUpperCase()}</option>
      ))}
    </select>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { locales } from 'yapyak';
import { locale } from '@yapyak/vue';
</script>

<template>
  <select v-model="locale">
    <option v-for="locale in locales" :key="locale" :value="locale">
      {{ locale.toUpperCase() }}
    </option>
  </select>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { locales } from 'yapyak';
  import { locale } from '@yapyak/svelte';
</script>

<select bind:value={locale.current}>
  {#each locales as locale}
    <option value={locale}>{locale.toUpperCase()}</option>
  {/each}
</select>
```

{% /code-group %}

The framework-specific imports (`yapyak/react`, `yapyak/vue`, `yapyak/svelte`) only differ in *how* the locale is reactively bound — `t` and the rest of `'yapyak'`'s exports are the same everywhere.

## Subscribing to locale changes

Outside framework components — e.g. persistence layers, analytics, document.lang sync — use `subscribeLocale(fn)` to react imperatively:

```ts
import { subscribeLocale } from 'yapyak';

const unsubscribe = subscribeLocale((locale) => {
  document.documentElement.lang = locale;
});
// Later: unsubscribe()
```

The callback receives the new locale. It fires whenever `setLocale(...)` is called with a new value. Returns an unsubscribe function.

## Persistence

The user's locale choice can be persisted in three ways. Set in `yapyak.config.ts`:

```ts
import { defineConfig } from 'yapyak';

export default defineConfig({
  persistence: 'cookie',         // SSR-safe (recommended)
  // OR
  persistence: 'local-storage',   // SPA-only
  // OR
  persistence: null,             // in-memory, refresh resets (default)
});
```

### Cookie

The right choice for SSR apps. Sent with every request, so the server can read it and pre-render in the user's locale. The cookie is written client-side on `setLocale()`, with `path=/`, `samesite=lax`, `max-age=1y`.

Customize the cookie name via the object form:

```ts
export default defineConfig({
  persistence: { type: 'cookie', name: 'app-locale' },
});
```

See [CookiePersistence](/reference/yapyak/CookiePersistence) for all fields and defaults.

### localStorage

For pure SPAs (no SSR) or apps avoiding cookie consent requirements.

Tradeoff: server can't read it. First paint always renders in the default locale; the client swaps to the user's locale after hydration. Brief flash possible.

```ts
export default defineConfig({
  persistence: { type: 'local-storage', key: 'app:locale' },
});
```

See [LocalStoragePersistence](/reference/yapyak/LocalStoragePersistence) for all fields and defaults.

### URL

Locale lives in the URL path. The right choice for routing apps that want shareable locale URLs.

The shortest form reads the first path segment:

```ts
export default defineConfig({
  persistence: 'url',
});
```

A request to `/sv/dashboard` resolves to `sv` if `sv` is among the configured locales. Otherwise the URL contributes nothing and the locale falls back to the default.

For URLs where the locale isn't the first segment, pass a `match` pattern:

```ts
export default defineConfig({
  persistence: { type: 'url', match: /\/app\/(?<locale>en|sv|fi)\// },
});
```

The first capture group (named `locale` or unnamed) becomes the active locale, if it matches a configured locale.

Unlike `cookie` or `localStorage`, URL persistence is read-only from yapyak's side. `setLocale()` updates the in-memory store but doesn't change the URL. Pair it with your router's navigation so changing locale also navigates to the right path.

See [UrlPersistence](/reference/yapyak/UrlPersistence) for all fields.

### No persistence (default)

`persistence: null`. Refresh resets to the default locale. Useful for ephemeral sessions, demos, or when another mechanism (e.g. a session API) handles persistence.

## SSR detection

When `persistence: 'cookie'` is set *and* an SSR adapter is wired ([TanStack Start](/guide/adapters/tanstack-start), [SvelteKit](/guide/adapters/sveltekit), or [custom](/guide/adapters/custom)), the locale resolves per request through this cascade:

1. **Cookie** (the user's explicit choice) — highest priority
2. **`Accept-Language` header** (browser/OS preference) — if `detectAcceptLanguage: true`
3. **Default locale** (configured fallback)

Each request picks the right locale before HTML renders. `getLocale()` returns the per-request value; `t()` calls in SSR render in that locale; the cookie matches what the client reads, so there's no hydration mismatch.

To opt into `Accept-Language` matching:

```ts
export default defineConfig({
  persistence: 'cookie',
  detectAcceptLanguage: true,   // default: false
});
```

Off by default because it adds a dependency on header parsing semantics. Turn it on when you want browser-language detection without writing the parser yourself.

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
