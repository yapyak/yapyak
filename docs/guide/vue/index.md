---
order: 20
---

# Vue

Yapyak's Vue adapter is intentionally idiomatic — none of the React patterns leak across. You install a plugin once, and then you import composables.

- **[Vanilla](./vanilla)** — Vue + Vite SPA. Currently the only supported flavor. Nuxt is on the radar; reach out if you want to help.

The mental model:

```vue
<script setup lang="ts">
import { t, useLocale } from 'yapyak';

const locale = useLocale();   // WritableComputedRef<Locale>
</script>

<template>
  <h1>{{ t('Hello') }}</h1>
  <button @click="locale = locale === 'en' ? 'sv' : 'en'">
    {{ locale.toUpperCase() }}
  </button>
</template>
```

`locale` is a writable computed ref. Read `locale.value` (or just `locale` in templates — Vue auto-unwraps). Assign `locale.value = 'sv'` and yapyak writes the cookie and re-renders. No tuple, no setter parameter — you just assign, like every other Vue ref you've ever used.
