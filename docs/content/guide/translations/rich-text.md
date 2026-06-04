---
title: Rich text
order: 6
---

Sometimes a message needs to contain more than text: a link, an emphasized phrase, or another interface element placed inside the sentence.

For React, Vue, and Svelte, yapyak provides a `<RichText>` component. It takes a string containing named tags and renders those tags using the components you provide:

{% switch group="framework" %}

{% when value="react" %}
```tsx [Notice.tsx]
import { RichText } from '@yapyak/react';
import { t } from 'yapyak';

export function Notice() {
  return (
    <RichText
      value={t('Read the <link>documentation</link> to get started.')}
      link={(children) => <a href="/docs">{children}</a>}
    />
  );
}
```
{% /when %}

{% when value="vue" %}
```vue [Notice.vue]
<script setup lang="ts">
import { RichText } from '@yapyak/vue';
import { t } from 'yapyak';
</script>

<template>
  <RichText :value="t('Read the <link>documentation</link> to get started.')">
    <template #link="{ children }">
      <a href="/docs">{{ children }}</a>
    </template>
  </RichText>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte [Notice.svelte]
<script lang="ts">
  import { RichText } from '@yapyak/svelte';
  import { t } from 'yapyak';
</script>

<RichText value={t('Read the <link>documentation</link> to get started.')}>
  {#snippet link(children)}
    <a href="/docs">{@render children()}</a>
  {/snippet}
</RichText>
```
{% /when %}

{% when value="astro" %}
For Astro islands, use one of the framework bindings (React/Vue/Svelte) inside an island component. `RichText` requires a reactive runtime, so it is not directly available in `.astro` files. For static rich-text rendering in a `.astro` file, use [`richText()`](#rendering-to-a-string) below to render directly to a string.
{% /when %}

{% /switch %}

In each example, `<RichText>` interprets `<link>...</link>` as a named part of its `value` and passes its contents to the `link` renderer. The string happens to come from `t()`, but the tag convention does not belong to translation.

`t()` is compiled ahead of time and still returns a string. It does not render components, and it does not need to know whether `<link>` eventually becomes an `<a>`, a router link, or plain text.

That separation is useful. The tag remains inside the translated message, where it can move with the language:

```translation
en: Read the <link>documentation</link> to get started.
de: Lies zum Einstieg die <link>Dokumentation</link>.
```

Its renderer remains in your component code, free to operate on any string containing named tags:

{% switch group="framework" %}

{% when value="react" %}
```tsx
<RichText
  value="Read the <link>documentation</link> to get started."
  link={(children) => <a href="/docs">{children}</a>}
/>
```
{% /when %}

{% when value="vue" %}
```vue
<RichText value="Read the <link>documentation</link> to get started.">
  <template #link="{ children }">
    <a href="/docs">{{ children }}</a>
  </template>
</RichText>
```
{% /when %}

{% when value="svelte" %}
```svelte
<RichText value="Read the <link>documentation</link> to get started.">
  {#snippet link(children)}
    <a href="/docs">{@render children()}</a>
  {/snippet}
</RichText>
```
{% /when %}

{% when value="astro" %}
In `.astro` files, prefer [`richText()`](#rendering-to-a-string) — it renders to a string directly without a reactive runtime.
{% /when %}

{% /switch %}

`<RichText>` works whether the string came from `t()` or somewhere else.

## Static tag checking

Rich text is rendered at runtime, but when the value is statically known, yapyak can also know which renderers it requires.

In React and Svelte, a value containing `<link>...</link>` requires a matching `link` renderer:

```tsx
<RichText value={t('Read the <link>documentation</link> to get started.')} />
// TypeScript error: missing `link` renderer
```

Vue exposes the corresponding named slots, but cannot require them in the same way.

## Rendering to a string

When the output should be a string rather than a component tree, use `richText()`. Like `<RichText>`, `richText()` interprets named tags in its input string. Instead of components, its handlers return strings:

```ts
import { richText, t } from 'yapyak';

const html = richText(
  t('Read the <link>documentation</link> to get started.'),
  {
    link: (children) => `<a href="/docs">${children}</a>`,
  },
);
```

The same check applies: if the input string contains `<link>...</link>`, a matching `link` handler must be provided.

A handler can also keep the contents of a tag without adding markup around them:

```ts
const text = richText(
  t('Read the <link>documentation</link> to get started.'),
  {
    link: (children) => children,
  },
);
```

`<RichText>` renders named parts into components. `richText()` renders them into strings. `t()` provides the translated message.
