---
title: Switch
order: 2
---

React has a `useLocale` hook, Vue a `locale` ref, Svelte a `locale.current` rune. Use the binding inside components; the bare `getLocale()` and `setLocale()` work everywhere else.

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

The hook subscribes the component to locale changes. Any `setLocale()` call re-renders every subscribed component, no matter where it comes from.
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

The shape uses Svelte 5's runes. `locale.current` is reactive. Every component that reads it re-runs when the locale changes.
{% /when %}

{% when value="astro" %}
Astro renders on the server, so locale switching doesn't happen client-side reactively. It happens through a navigation that the middleware translates into a new active locale. With `persistence: 'url'` (the default reads the first path segment), a plain link is enough:

```astro
---
import { getLocale, t } from 'yapyak';

const current = getLocale();
const next = current === 'en' ? 'sv' : 'en';
---

<a href={`/${next}/`}>{t('Switch language')}</a>
```

The middleware reads the URL on the next request, sets the locale for that render, and the layout re-renders in the new language. For richer client-side switching from inside an Astro island, use the React/Vue/Svelte binding from within that island.
{% /when %}

{% /switch %}

## The underlying API

Underneath the framework binding, yapyak exports the raw store:

```ts
import { defaultLocale, getLocale, locales, setLocale } from 'yapyak';
```

- [`getLocale()`](/reference/yapyak/getLocale) returns the current [`Locale`](/reference/yapyak/Locale).
- [`setLocale('sv')`](/reference/yapyak/setLocale) switches the active locale.
- [`locales`](/reference/yapyak/locales) is the array of `Locale` values you've added.
- [`defaultLocale`](/reference/yapyak/defaultLocale) is the fallback `Locale` from your config.

You'll reach for these directly when:

- Building a locale switcher that lives outside the framework binding (a vanilla script tag, a compile-time helper)
- Reading the `locales` array to render a dropdown of every available language

Inside a component, prefer the framework binding above: it subscribes the component to locale changes and reads correctly under SSR.

## Rendering a locale switcher

A common pattern: a dropdown that lists every available locale and switches to whichever one the user picks. The `locales` array is the source. It reflects every `<locale>.json` file in your [`localesDir`](/guide/getting-started/configuration#localesdir).

{% switch group="framework" %}

{% when value="react" %}
```tsx
import { useLocale } from '@yapyak/react';
import { locales, parseLocale } from 'yapyak';

export function LocaleSwitcher() {
  const [locale, setLocale] = useLocale();

  return (
    <select
      value={locale}
      onChange={(event) => {
        const next = parseLocale(event.target.value);
        if (next) {
          setLocale(next);
        }
      }}
    >
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

The `labelOf` helper is up to you. yapyak doesn't ship one because the right label depends on your app. A common choice is the locale's native name (`labelOf('sv') === 'Svenska'`), often computed with `new Intl.DisplayNames(value, { type: 'language' }).of(value)`.

{% callout variant="tip" %}
If you want the user's choice to survive a refresh or a new tab, pair the switcher with a [persistence](/guide/switching/persistence) strategy. Without one, the active locale lives only for the current page session.
{% /callout %}
