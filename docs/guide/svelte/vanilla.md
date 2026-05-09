---
order: 31
---

# Svelte (Vanilla)

Svelte 5 + Vite. Runes. No SvelteKit, no SSR concerns.

## vite.config.ts

```ts
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      persistence: 'cookie',
      framework: 'svelte',
    }),
    svelte(),
  ],
});
```

`framework: 'svelte'` is required — without it the plugin emits the React adapter and your imports will fail.

## main.ts

```ts
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
```

That's the entire setup. No `app.use()`, no Provider component. The yapyak runtime initializes the moment you `import` it, which happens implicitly when `App.svelte` imports `t` or `locale`.

## App.svelte

```svelte
<script lang="ts">
  import { locale, t } from 'yapyak';
</script>

<main>
  <h1>{t('Hello')}</h1>
  <p>{t('Welcome, {name}!', { name: 'Joakim' })}</p>
  <button
    onclick={() => (locale.current = locale.current === 'en' ? 'sv' : 'en')}
  >
    {locale.current.toUpperCase()}
  </button>
</main>
```

Two imports, four lines of logic, real-time locale switching. The `locale` singleton uses `$state` internally — reading `.current` registers a fine-grained reactivity dependency, so any element reading it re-renders automatically when the locale changes.

## Plurals and select

Svelte's template parser doesn't share Vue's quirk — you can write the plural inline:

```svelte
<p>{t('You have {count, plural, one {# item} other {# items}}', { count: 3 })}</p>
```

Or wrap in `$derived` if you want the value memoized:

```svelte
<script lang="ts">
  import { t } from 'yapyak';
  const itemCount = $derived(
    t('You have {count, plural, one {# item} other {# items}}', { count: 3 }),
  );
</script>

<p>{itemCount}</p>
```

Either works.

## When you outgrow vanilla

If you need SSR, SEO-friendly pre-rendering, or just routing — switch to **[SvelteKit](./sveltekit)**. The yapyak runtime is the same; SvelteKit just gives you a `hooks.server.ts` to read the request cookie before render.
