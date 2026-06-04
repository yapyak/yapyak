---
title: Introduction
order: 1
---

yapyak is an i18n library for Vite applications using React, Vue, Svelte, or Astro. It includes SSR support for Astro, React Router, SvelteKit, and TanStack Start. You write interface text in source code, and yapyak keeps your locale files in sync as you build your application.

## Translations follow code

In yapyak, you write the source-language message directly in the code that uses it:

{% switch group="framework" %}

{% when value="react" %}
```tsx [src/components/empty-cart.tsx]
import { t } from 'yapyak';

export function EmptyCart() {
  return <p>{t('Your cart is empty')}</p>;
}
```
{% /when %}

{% when value="vue" %}
```vue [src/components/EmptyCart.vue]
<script setup lang="ts">
import { t } from 'yapyak';
</script>

<template>
  <p>{{ t('Your cart is empty') }}</p>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte [src/components/EmptyCart.svelte]
<script lang="ts">
  import { t } from 'yapyak';
</script>

<p>{t('Your cart is empty')}</p>
```
{% /when %}

{% when value="astro" %}
```astro [src/components/EmptyCart.astro]
---
import { t } from 'yapyak';
---

<p>{t('Your cart is empty')}</p>
```
{% /when %}

{% /switch %}

On save, yapyak writes any new message to your locale files in `locales/` as an empty stub:

{% switch group="framework" %}

{% when value="react" %}
```json [locales/sv.json]
{
  "src/components/empty-cart.tsx": {
    "Your cart is empty": ""
  }
}
```
{% /when %}

{% when value="vue" %}
```json [locales/sv.json]
{
  "src/components/EmptyCart.vue": {
    "Your cart is empty": ""
  }
}
```
{% /when %}

{% when value="svelte" %}
```json [locales/sv.json]
{
  "src/components/EmptyCart.svelte": {
    "Your cart is empty": ""
  }
}
```
{% /when %}

{% when value="astro" %}
```json [locales/sv.json]
{
  "src/components/EmptyCart.astro": {
    "Your cart is empty": ""
  }
}
```
{% /when %}

{% /switch %}

Translations stay connected to the source code that uses them. Move or rename a source file, and yapyak restores its translations under the new path. Copy markup to a new file, remove it, or bring it back later, and yapyak reuses translations it already knows.

## AI translation

The stub can be filled in by you or your coding agent. It can also be filled automatically by a *translator*.

A translator connects directly to an AI model of your choice, using your own provider key:

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    voice: 'Concise and friendly',
    glossary: {
      cart: { sv: 'kundvagn' },
    },
  }),
});
```

On save, yapyak sends new messages with their source context, configured voice, glossary and relevant translation examples from the application. The returned values are written to the locale files:

{% switch group="framework" %}

{% when value="react" %}
```json [locales/sv.json]
{
  "src/components/empty-cart.tsx": {
    "Your cart is empty": "Din kundvagn är tom"
  }
}
```
{% /when %}

{% when value="vue" %}
```json [locales/sv.json]
{
  "src/components/EmptyCart.vue": {
    "Your cart is empty": "Din kundvagn är tom"
  }
}
```
{% /when %}

{% when value="svelte" %}
```json [locales/sv.json]
{
  "src/components/EmptyCart.svelte": {
    "Your cart is empty": "Din kundvagn är tom"
  }
}
```
{% /when %}

{% when value="astro" %}
```json [locales/sv.json]
{
  "src/components/EmptyCart.astro": {
    "Your cart is empty": "Din kundvagn är tom"
  }
}
```
{% /when %}

{% /switch %}

Vite HMR updates the running application with the translated text.

## Direct AI calls

yapyak sends new messages directly to your AI provider. One request can carry multiple messages and every configured locale at once, with optional source context. Request size, concurrency, and context are configurable.

Source context comes from your code. Locale files and translation memory live in your project. No yapyak service sits between your project and the model.

