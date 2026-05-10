# Locales

Locales are configured implicitly. The default lives in your code; the others live as files in `locales/`.

## Auto-discovery

yapyak doesn't ask you to list locales in `vite.config.ts`. Whatever JSON files exist in `locales/` *are* your non-default locales:

```
locales/
  es.json    ← Spanish locale exists
  fr.json    ← French locale exists
  de.json    ← German locale exists
```

Implicit configuration: `defaultLocale: 'en'`, `locales: ['en', 'es', 'fr', 'de']`. Add a file → it's a new locale. Delete a file → it's gone.

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

`getLocales()` returns the default locale plus every JSON file in `locales/`. Useful for building locale switchers — see [Frameworks](/guide/frameworks/) for the per-framework patterns.

## Switching locale

```ts
import { setLocale } from 'yapyak';

setLocale('es');
```

Updates the in-memory store, persists according to your `persistence` config, and notifies all subscribed `useLocale` hooks. Components re-render in the new locale.

In components, prefer the framework-idiomatic locale binding:

- **React**: `const [locale, setLocale] = useLocale()` from `yapyak/react`
- **Svelte**: `import { locale } from 'yapyak/svelte'` — singleton, read/write via `locale.current`
- **Vue**: `import { locale } from 'yapyak/vue'` — singleton `WritableComputedRef`, read/write via `.value` (or `v-model`)

See:

- [Frameworks / React](/guide/frameworks/react)
- [Frameworks / Svelte](/guide/frameworks/svelte)
- [Frameworks / Vue](/guide/frameworks/vue)

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

The right choice for SSR apps. Sent with every request → server can read it and pre-render in the user's locale. The cookie is written client-side on `setLocale()`, with `path=/`, `samesite=lax`, `max-age=1y`.

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

Each request picks the right locale before HTML renders. `getLocale()` returns the per-request value; `t()` calls in SSR render in that locale; the cookie matches what the client reads → no hydration mismatch.

To opt into `Accept-Language` matching:

```ts
yapyak({
  persistence: 'cookie',
  acceptLanguage: true,   // default: false
})
```

Off by default because it adds a dependency on header parsing semantics; on for apps that want browser-language detection out of the box.

## Manual configuration (rare)

You usually don't need to call `configureLocale` yourself — the Vite plugin generates a setup file (`virtual:yapyak/setup`) that calls it automatically. But if you're consuming yapyak outside the Vite build (a Node CLI script, a server function, a worker), you can configure manually:

```ts
import { configureLocale } from 'yapyak';

configureLocale({
  defaultLocale: 'en',
  locales: ['en', 'es', 'fr'],
  persistence: 'cookie',
});
```

After configuration, `getLocale()`, `setLocale()`, and `t()` all work normally. If you call `configureLocale` more than once, the latest call wins.

## Locale-code conventions

yapyak is locale-agnostic — any string works as a locale code. Common conventions:

- ISO 639-1 codes: `en`, `es`, `fr`, `de`, `ja`
- Country variants: `en-US`, `en-GB`, `pt-BR`, `pt-PT`
- Custom: `internal`, `qa`, `pseudo` for testing

The plugin doesn't validate codes — whatever filename you create in `locales/` becomes a valid locale. Use whatever convention your team prefers.

## Default-locale fallback

When a translation is missing for a target locale (e.g. AI hasn't filled it in yet), the runtime falls back to the default locale's source string. Users see English instead of an empty UI. No `[missing translation key: ...]` placeholders, no errors.

```tsx
t('A new untranslated string')
// Rendered as 'A new untranslated string' in es, fr, de, etc.
// until auto-translate fills in the locale-specific values.
```

This is what makes "save the file, ship live" safe. There's no broken intermediate state.
