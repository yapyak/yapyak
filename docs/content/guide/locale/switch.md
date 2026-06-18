---
title: Switch
order: 2
---

There's one active locale at any moment. Reading it, changing it, and re-rendering on changes are all part of the runtime API. Your framework binding wraps `getLocale()` and `setLocale()` from `yapyak` in an idiomatic shape — see below for what that looks like in your stack.

## The framework binding

{% switch group="framework" %}

{% when value="react" %}
`@yapyak/react` exports a `useLocale` hook that returns a tuple of the active locale and a setter. The shape mirrors React's `useState`, so anything that has used `useState` already knows how to use it:

```tsx
import { useLocale } from '@yapyak/react';
import { t } from 'yapyak';

export function LanguageButton() {
  const [locale, setLocale] = useLocale();

  return (
    <button onClick={() => setLocale(locale === 'en' ? 'sv' : 'en')}>
      {t('Switch language')}
    </button>
  );
}
```

The hook subscribes the component to locale changes. Anything that calls it re-renders when `setLocale()` is called from anywhere in the app — your locale switcher, a server-rendered cookie, a forced URL parameter.
{% /when %}

{% when value="vue" %}
`@yapyak/vue` exports a reactive `locale` ref. Read it like any Vue ref; assign to it to switch.

```vue
<script setup lang="ts">
import { locale } from '@yapyak/vue';
import { t } from 'yapyak';
</script>

<template>
  <button @click="locale = locale === 'en' ? 'sv' : 'en'">
    {{ t('Switch language') }}
  </button>
</template>
```

It's a `Ref<Locale>` — the standard Vue reactivity contract. Components that read `locale.value` (or rely on auto-unwrapping in templates) re-render when it changes, and an assignment triggers every subscriber.
{% /when %}

{% when value="svelte" %}
`@yapyak/svelte` exports a `locale` object with a single `current` property. Reading it tracks the active locale; assigning to it switches.

```svelte
<script lang="ts">
  import { locale } from '@yapyak/svelte';
  import { t } from 'yapyak';
</script>

<button onclick={() => (locale.current = locale.current === 'en' ? 'sv' : 'en')}>
  {t('Switch language')}
</button>
```

The shape uses Svelte 5's runes. `locale.current` is reactive — every component that reads it re-runs when the locale changes.
{% /when %}

{% when value="astro" %}
Astro renders on the server, so locale switching doesn't happen client-side reactively — it happens through a navigation that the middleware translates into a new active locale. With `persistence: 'url'` (or `'cookie'`) set in your config, a plain link is enough:

```astro
---
import { getLocale, t } from 'yapyak';

const current = getLocale();
const next = current === 'en' ? 'sv' : 'en';
---

<a href={`?locale=${next}`}>{t('Switch language')}</a>
```

The middleware reads the URL (or cookie) on the next request, sets the locale for that render, and the layout re-renders in the new language. For richer client-side switching from inside an Astro island, use the React/Vue/Svelte binding from within that island.
{% /when %}

{% /switch %}

## The underlying API

Underneath the framework binding, yapyak exports the raw store:

```ts
import { getLocale, setLocale, locales, defaultLocale, subscribeLocale } from 'yapyak';

getLocale();              // the current Locale
setLocale('sv');          // switches the active locale
locales;                  // the array of Locale values you've added
defaultLocale;            // the fallback Locale from your config

const unsubscribe = subscribeLocale((next) => {
  console.log('Locale changed to', next);
});
unsubscribe();            // stops listening
```

You'll reach for these directly when:

- Building a locale switcher that lives outside the framework binding (a vanilla script tag, a compile-time helper)
- Reacting to locale changes from non-component code (analytics, logging, a global event bus)
- Reading the `locales` array to render a dropdown of every available language

For everything inside a component, prefer the framework binding above — it wires reactivity for you and survives SSR correctly.

## Rendering a locale switcher

A common pattern: a dropdown that lists every available locale and switches to whichever one the user picks. The `locales` array is the source — it reflects every `<locale>.json` file in your [`localesDir`](/guide/getting-started/configuration#localesdir).

{% switch group="framework" %}

{% when value="react" %}
```tsx
import { useLocale } from '@yapyak/react';
import { locales } from 'yapyak';

export function LocaleSwitcher() {
  const [locale, setLocale] = useLocale();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      {locales.map((value) => (
        <option key={value} value={value}>
          {labelOf(value)}
        </option>
      ))}
    </select>
  );
}
```
{% /when %}

{% when value="vue" %}
```vue
<script setup lang="ts">
import { locale } from '@yapyak/vue';
import { locales } from 'yapyak';
</script>

<template>
  <select v-model="locale">
    <option v-for="value in locales" :key="value" :value="value">
      {{ labelOf(value) }}
    </option>
  </select>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte
<script lang="ts">
  import { locale } from '@yapyak/svelte';
  import { locales } from 'yapyak';
</script>

<select bind:value={locale.current}>
  {#each locales as value (value)}
    <option {value}>{labelOf(value)}</option>
  {/each}
</select>
```
{% /when %}

{% when value="astro" %}
```astro
---
import { getLocale, locales } from 'yapyak';

const current = getLocale();
---

<form method="get">
  <select name="locale" onchange="this.form.submit()">
    {locales.map((value) => (
      <option value={value} selected={value === current}>{labelOf(value)}</option>
    ))}
  </select>
</form>
```

With `persistence: 'url'` set, submitting the form navigates to a URL containing the active locale, and the middleware picks it up on the next render.
{% /when %}

{% /switch %}

The `labelOf` helper is up to you — yapyak doesn't ship one because the right label depends on your app. A common choice is the locale's native name (`labelOf('sv') === 'Svenska'`), often computed with `new Intl.DisplayNames(value, { type: 'language' }).of(value)`.

{% callout variant="tip" %}
If you want the user's choice to survive a refresh or a new tab, pair the switcher with a [persistence](/guide/locale/persistence) strategy. Without one, the active locale lives only for the current page session.
{% /callout %}
