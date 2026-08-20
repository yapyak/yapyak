---
title: Context
order: 7
---

`context` controls how much call-site code yapyak sends with each translation request. The model uses it to tell apart short messages that have more than one meaning.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    context: 'minimal'
  })
});
```

## Default

`'minimal'`.

## Levels

| Level | What's sent | When to use |
|---|---|---|
| `'none'` | Source string only. | Privacy-sensitive code. |
| `'minimal'` | Source, component name, element tag, and attribute name (when available). | Default. Enough to tell `Open` (button) from `Open` (status badge). |
| `'rich'` | Above plus surrounding source code. | When the component name and element alone can't tell two uses apart. |

A higher level produces better translations for tricky strings at the cost of more tokens per request.

{% callout variant="info" %}
A [disambiguation](/guide/writing/homonyms) from `t.as(context, source)` is sent at every level, including `'none'`. It travels with the source string rather than with the call-site context.
{% /callout %}

## Minimal

For this call:

{% switch group="framework" %}

{% when value="react" %}
```tsx [src/components/file-menu.tsx]
<button onClick={openFile}>{t('Open')}</button>
```
{% /when %}

{% when value="vue" %}
```vue [src/components/file-menu.vue]
<button @click="openFile">{{ t('Open') }}</button>
```
{% /when %}

{% when value="svelte" %}
```svelte [src/components/file-menu.svelte]
<button onclick={openFile}>{t('Open')}</button>
```
{% /when %}

{% when value="astro" %}
```astro [src/components/file-menu.astro]
<button>{t('Open')}</button>
```
{% /when %}

{% /switch %}

The request carries:

```ts
{
  source: 'Open',
  component: 'FileMenu',
  element: 'button'
}
```

Enough for the model to translate `Open` as the imperative verb on a button rather than the adjective "open" describing a state.

When the call is an attribute value — `aria-label={t('Pause')}` — the request also carries `attribute: 'aria-label'`, so the model translates it with that attribute's conventions rather than as visible copy. The field is absent for content. The name is sent as written in the source: a component prop like `<Tooltip label={t('Save')}>` carries `label`, and yapyak never rewrites or normalizes the name.

## Rich

The same call at `context: 'rich'` adds a `snippet`:

{% switch group="framework" %}

{% when value="react" %}
```ts
{
  source: 'Open',
  component: 'FileMenu',
  element: 'button',
  snippet: "<button onClick={openFile}>{t('Open')}</button>"
}
```
{% /when %}

{% when value="vue" %}
```ts
{
  source: 'Open',
  component: 'FileMenu',
  element: 'button',
  snippet: '<button @click="openFile">{{ t(\'Open\') }}</button>'
}
```
{% /when %}

{% when value="svelte" %}
```ts
{
  source: 'Open',
  component: 'FileMenu',
  element: 'button',
  snippet: "<button onclick={openFile}>{t('Open')}</button>"
}
```
{% /when %}

{% when value="astro" %}
```ts
{
  source: 'Open',
  component: 'FileMenu',
  element: 'button',
  snippet: "<button>{t('Open')}</button>"
}
```
{% /when %}

{% /switch %}

The model sees the code around the call, which is usually enough to nail down meaning the component name alone misses.

## Privacy

Call-site context is part of the request to your provider. It goes from your machine to the model and never routes through yapyak. To send the source string only, set `'none'` — that level also turns off [`examples`](/guide/translating/examples).

## Per-item examples

The `context` setting also affects whether yapyak sends [`examples`](/guide/translating/examples). With `context: 'none'`, the default for the translator's `examples` option is `0`.
