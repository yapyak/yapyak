---
order: 30
---

# Svelte

The Svelte adapter is the cleanest of the three, because Svelte 5 lets us be: no Provider, no `app.use()`, no hook-shaped composable. You import a singleton, you read its `.current`, you assign to it. Done.

- **[Vanilla](./vanilla)** — Svelte + Vite SPA.
- **[SvelteKit](./sveltekit)** — full-stack, with `hooks.server.ts` for cookie-aware SSR.

The shape:

```svelte
<script lang="ts">
  import { locale, t } from 'yapyak';
</script>

<h1>{t('Hello')}</h1>
<button onclick={() => (locale.current = locale.current === 'en' ? 'sv' : 'en')}>
  {locale.current.toUpperCase()}
</button>
```

`locale` is a singleton with a `.current` getter and setter — exactly the pattern Svelte uses internally for `scrollX`, `innerWidth`, and `MediaQuery`. Reading `.current` registers a fine-grained reactivity dependency. Assigning to it triggers the setter, which writes the cookie and notifies the runtime.

No `useLocale()`, no tuple, no `Ref`. Just `locale.current`. This is the way.
