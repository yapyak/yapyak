# Vue

```bash
npm install yapyak
```

`yapyak/vue` exports the Vue-specific reactive locale binding. `t` is framework-agnostic and is also re-exported from `yapyak/vue` for convenience.

## Imports

```vue
<script setup lang="ts">
import { locale, t } from 'yapyak/vue';
import { getLocales } from 'yapyak';
</script>
```

- `locale` — singleton `WritableComputedRef<string>`, ref-compatible
- `t` — the translation function
- `getLocales` — non-reactive list of every configured locale

## The `locale` singleton

There's no `useLocale()` composable in Vue. Just import `locale` directly:

```vue
<script setup lang="ts">
import { locale, t } from 'yapyak/vue';
</script>

<template>
  <button @click="locale = 'es'">
    {{ locale.toUpperCase() }}
  </button>
</template>
```

`locale` is a `WritableComputedRef<string>` — full Vue ref behavior:

- **In `<template>`:** `{{ locale }}` reads the value, `v-model="locale"` binds two-way
- **In `<script>`:** `locale.value` reads, `locale.value = 'es'` writes
- Reactive — components re-render when locale changes
- Subscribes to the underlying store internally; persists via cookie or localStorage if configured

## Locale switcher

```vue
<script setup lang="ts">
import { getLocales } from 'yapyak';
import { locale } from 'yapyak/vue';
const locales = getLocales();
</script>

<template>
  <select v-model="locale">
    <option v-for="locale in locales" :key="locale" :value="locale">
      {{ locale.toUpperCase() }}
    </option>
  </select>
</template>
```

`v-model="locale"` works because `locale` is a writable computed ref. Selecting an option writes the new value, which propagates to the store and every other subscriber.

## Component example

```vue
<script setup lang="ts">
import { t } from 'yapyak/vue';
defineProps<{ count: number }>();
</script>

<template>
  <div>
    <h2>{{ t('Your cart') }}</h2>
    <p>{{ t('You have {count, plural, one {# item} other {# items}}', { count }) }}</p>
    <button>{{ t('Checkout') }}</button>
  </div>
</template>
```

`t()` calls work in both `<template>` and `<script>`. The plugin extracts them all and rewrites at build time.

## SSR

There's no first-party Vue SSR adapter shipping yet. If you're using a Vue meta-framework (Nuxt, Vite SSR, etc.), wire a [custom adapter](/guide/adapters/custom) — it's a few lines.

For pure SPAs, no adapter needed. `locale` works the same — initial value from `defaultLocale`, then from cookie or localStorage if `persistence` is configured.

```ts
// vite.config.ts
yapyak({
  persistence: 'localStorage',
  translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
}),
```

## Common patterns

### Reading locale in non-Vue code

In `.ts` or `.js` files (utilities, server functions, plain modules), use `getLocale` from `yapyak`:

```ts
import { getLocale } from 'yapyak';

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
```

`getLocale()` is non-reactive — it reads the current value once. For reactive reads inside Vue components, use `locale`.

### Conditional rendering on locale

```vue
<script setup lang="ts">
import { locale } from 'yapyak/vue';
</script>

<template>
  <JapaneseLayout v-if="locale === 'ja'" />
  <DefaultLayout v-else />
</template>
```

### Forced-locale rendering (emails, scheduled jobs)

```ts
import { t } from 'yapyak';

function emailSubject(userLocale: string) {
  return t.in(userLocale)('Your invoice is ready');
}
```

`t.in(locale)` returns the translation in a specific locale, regardless of the active one.

## Why no `useLocale()`

Vue's standard pattern *is* `useX()` composables (`useRouter`, `useStore`). yapyak deviates because:

- The locale is a single global value, not per-component state
- A composable adds a function-call wrapper around a value that already exists as a singleton
- `import { locale } from 'yapyak/vue'` is one fewer step than `const locale = useLocale()` for the same result

If you'd prefer a `useLocale` shape (e.g., to match other libraries' conventions), wrap it yourself in three lines:

```ts
import { locale } from 'yapyak/vue';
export function useLocale() {
  return locale;
}
```

But the singleton import does the job directly.
