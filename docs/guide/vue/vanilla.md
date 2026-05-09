---
order: 21
---

# Vue (Vanilla)

Vue 3 + Vite. Composition API. Runes-energy, Vue-style.

## vite.config.ts

```ts
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      persistence: 'cookie',
      framework: 'vue',
    }),
    vue(),
  ],
});
```

The `framework: 'vue'` tells the plugin to generate the Vue-flavored runtime module. Without it, the plugin emits a runtime-free module without `useLocale()` and your imports will fail.

## main.ts

```ts
import { createApp } from 'vue';
import { yapyak } from 'yapyak';
import App from './App.vue';

createApp(App).use(yapyak).mount('#app');
```

The `yapyak` export here is the plugin object — pass it to `app.use()` once and you're done. The plugin doesn't actually do much today (no devtools, no global mixins) but the install hook is reserved, so we won't break your code if we add things later.

## App.vue

<div v-pre>

```vue
<script setup lang="ts">
import { t, useLocale } from 'yapyak';

const locale = useLocale();
</script>

<template>
  <main>
    <h1>{{ t('Hello') }}</h1>
    <p>{{ t('Welcome, {name}!', { name: 'Joakim' }) }}</p>
    <button @click="locale = locale === 'en' ? 'sv' : 'en'">
      {{ locale.toUpperCase() }}
    </button>
  </main>
</template>
```

</div>

## The plural quirk

Vue's template parser uses <code v-pre>{{ }}</code> for interpolation. ICU plural and select messages contain `}}` (e.g. `... other {# items}}`) which collides. **Single placeholders are fine** inline. **Plurals need a wrapper:**

<div v-pre>

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { t } from 'yapyak';

const itemCount = computed(() =>
  t('You have {count, plural, one {# item} other {# items}}', { count: 3 }),
);
</script>

<template>
  <p>{{ itemCount }}</p>
</template>
```

</div>

That's it. Move the call into a `computed()`, render the result. The template parser only sees <code v-pre>{{ itemCount }}</code>, no collision.

## SSR

Not yet. Vanilla Vue SPA only at the moment. If you need SSR, this is a placeholder for the day Nuxt support lands. The runtime is already SSR-safe; we just haven't shipped the framework adapter for it.
