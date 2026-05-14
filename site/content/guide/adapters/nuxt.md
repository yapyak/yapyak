---
title: Nuxt
order: 3
---

Register yapyak as a Nitro plugin. Nuxt's middleware model is pre-handler — it can't wrap the request with a callback — so the adapter ships as a Nitro plugin that registers a lazy reader against Nuxt's own async context.

## Enable async context

In `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  experimental: {
    asyncContext: true,
  },
  vite: {
    plugins: [yapyak({ persistence: 'cookie' })],
  },
});
```

`experimental.asyncContext: true` enables Nuxt's request-scoped `useEvent()`. Without it, the adapter falls back silently and `getLocale()` returns the default locale during SSR.

## Wire the plugin

In `server/plugins/yapyak.ts`:

```ts
// server/plugins/yapyak.ts
export { default } from 'yapyak/adapters/nuxt';
```

That's the entire wiring. Every server-rendered request now resolves its own locale from cookie or `Accept-Language` header.

## Setting `<html lang>`

Use the `locale` ref from `yapyak/vue` in your root layout or `app.vue`:

```vue
<script setup lang="ts">
import { locale } from 'yapyak/vue';
</script>

<template>
  <html :lang="locale">
    <Head>
      <!-- ... -->
    </Head>
    <Body>
      <slot />
    </Body>
  </html>
</template>
```

Server-side, `locale` reads the request's locale via the Nitro plugin → Nuxt's `useEvent()` → `getLocale()`. Client-side, it's a writable Vue ref that updates reactively on `setLocale()`.

## Cookie persistence

For SSR locale switching to work, the user's choice must be readable by the server. Enable `persistence: 'cookie'` in the Vite plugin (shown above in `nuxt.config.ts`). The cookie is written client-side on `setLocale()` and read server-side by the plugin on every request. See [Locales / Persistence](/guide/locales#persistence).

## Requirements

- Nuxt 3 or 4.
- `experimental.asyncContext: true` in `nuxt.config.ts` — without it, `useEvent()` throws inside the lazy reader and locale resolution falls back to the default.
- Plugin file must be in `server/plugins/`, not `plugins/` (which is for client-side Nuxt plugins).
