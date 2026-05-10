# Svelte

```bash
npm install yapyak
```

`yapyak/svelte` exports the Svelte-specific reactive locale binding. `t` is framework-agnostic and is also re-exported from `yapyak/svelte` for convenience.

## Imports

```svelte
<script lang="ts">
  import { locale, t } from 'yapyak/svelte';
  import { getLocales } from 'yapyak';
</script>
```

- `locale` — singleton `ReactiveLocale` (`{ current: string }`), backed by `$state`
- `t` — the translation function
- `getLocales` — non-reactive list of every configured locale

## The `locale` singleton

There's no `useLocale()` hook in Svelte. Just import `locale` directly and use `locale.current`:

```svelte
<script lang="ts">
  import { locale, t } from 'yapyak/svelte';
</script>

<button onclick={() => (locale.current = 'es')}>
  {locale.current.toUpperCase()}
</button>
```

`locale.current` is a getter/setter:

- **Read** (`locale.current`) — returns the current locale string. Reactive — components re-render when it changes.
- **Write** (`locale.current = 'es'`) — sets the locale. Persisted (cookie/localStorage if configured) and broadcast to every subscriber.

Internally, `locale` wraps a Svelte 5 `$state` rune. Reactivity is automatic when you read `locale.current` inside `.svelte` files.

## Locale switcher

```svelte
<script lang="ts">
  import { getLocales } from 'yapyak';
  import { locale } from 'yapyak/svelte';
  const locales = getLocales();
</script>

<select bind:value={locale.current}>
  {#each locales as locale}
    <option value={locale}>{locale.toUpperCase()}</option>
  {/each}
</select>
```

`bind:value={locale.current}` works because `locale.current` is a setter. Selecting an option calls the setter, which updates the store and persists.

## Component example

```svelte
<script lang="ts">
  import { t } from 'yapyak/svelte';
  let count = $state(3);
</script>

<div>
  <h2>{t('Your cart')}</h2>
  <p>{t('You have {count, plural, one {# item} other {# items}}', { count })}</p>
  <button>{t('Checkout')}</button>
</div>
```

`t()` calls work both in the script and in the template. The plugin extracts them all and rewrites at build time.

## SSR with SvelteKit

For server-rendered Svelte via SvelteKit, add the adapter to `hooks.server.ts`:

```ts
// src/hooks.server.ts
export { handle } from 'yapyak/adapters/sveltekit';
```

And add the language placeholder to `app.html`:

```html
<!-- src/app.html -->
<!DOCTYPE html>
<html lang="%yapyak.lang%">
  <head>...</head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

The adapter resolves the locale per request from cookie + `Accept-Language`, replaces `%yapyak.lang%` with the resolved value, and ensures `getLocale()` returns the right locale during render. See [Adapters / SvelteKit](/guide/adapters/sveltekit) for details.

## SPA without SSR

If you're not using SvelteKit (or you've turned off SSR), skip the adapter. `locale` works the same — initial value from `defaultLocale`, then from cookie or localStorage if `persistence` is configured.

```ts
// vite.config.ts
yapyak({
  persistence: 'localStorage',
  translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
}),
```

## Common patterns

### Reading locale in non-Svelte code

In `.ts` or `.js` files (utilities, server functions), use `getLocale` from `yapyak`:

```ts
import { getLocale } from 'yapyak';

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
```

`getLocale()` is non-reactive — it reads the current value once. For reactive reads inside `.svelte` files, use `locale.current`.

### Conditional rendering on locale

```svelte
<script lang="ts">
  import { locale } from 'yapyak/svelte';
</script>

{#if locale.current === 'ja'}
  <JapaneseLayout />
{:else}
  <DefaultLayout />
{/if}
```

### Forced-locale rendering (emails, server functions)

```ts
import { t } from 'yapyak';

function emailSubject(userLocale: string) {
  return t.in(userLocale)('Your invoice is ready');
}
```

## Why no `useLocale()`

In Svelte 5, returning a primitive from a function and expecting it to stay reactive across the call boundary doesn't work cleanly. The OLD yapyak Svelte API used a `useLocale()` that returned `{ current }` — but the function call added no value. The singleton import does the same thing with one less indirection.

If you've used Svelte 5 stores (`writable`, `readable`), the pattern is familiar: import a reactive value directly, no factory function.
