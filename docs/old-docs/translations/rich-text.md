---
title: Rich text
order: 6
---

Sometimes a message needs to contain more than text: a link, an emphasized phrase, or another interface element placed inside the sentence.

yapyak provides a `<RichText>` component for React, Vue, Svelte, and Astro. It takes a string containing named tags and renders those tags using the handlers you provide:

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
```astro [Notice.astro]
---
import { RichText } from '@yapyak/astro';
import { t } from 'yapyak';
---

<RichText value={t('Read the <link>documentation</link> to get started.')}>
  <a slot="link" href="/docs"><RichText.Children /></a>
</RichText>
```
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
```astro
<RichText value="Read the <link>documentation</link> to get started.">
  <a slot="link" href="/docs"><RichText.Children /></a>
</RichText>
```
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

Vue and Astro expose handlers as loose slots and cannot require them at the type level. A tag with no matching slot renders as escaped literal text.

## Void tags

A tag with no inner content uses the self-closing form `<name/>`. The handler receives no arguments.

{% switch group="framework" %}

{% when value="react" %}
```tsx [Notice.tsx]
import { RichText } from '@yapyak/react';
import { t } from 'yapyak';

export function Notice() {
  return (
    <RichText
      value={t('Line one<br/>line two')}
      br={() => <br />}
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
  <RichText :value="t('Line one<br/>line two')">
    <template #br>
      <br/>
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

<RichText value={t('Line one<br/>line two')}>
  {#snippet br()}
    <br/>
  {/snippet}
</RichText>
```
{% /when %}

{% when value="astro" %}
```astro [Notice.astro]
---
import { RichText } from '@yapyak/astro';
import { t } from 'yapyak';
---

<RichText value={t('Line one<br/>line two')}>
  <br slot="br"/>
</RichText>
```
{% /when %}

{% /switch %}

The void form parses as a `void` node carrying no children. Use it for line breaks, inline icons, and any standalone marker.

## Building a custom renderer

For non-framework output — server-rendered HTML emails, plain-text fallbacks, custom string formats — use `parseRichText()` directly. It returns the parsed tree as a flat array of nodes:

```ts
import { parseRichText, t } from 'yapyak';

parseRichText(t('Click <link>here</link>.'));
// => [
//   { type: 'text', text: 'Click ' },
//   { type: 'tag', name: 'link', children: [{ type: 'text', text: 'here' }] },
//   { type: 'text', text: '.' },
// ]
```

Walk the tree to produce any output you want:

```ts
import { parseRichText, type RichTextNode } from 'yapyak';

function toPlain(nodes: RichTextNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text') return node.text;
      if (node.type === 'void') return '';
      return toPlain(node.children);
    })
    .join('');
}
```
