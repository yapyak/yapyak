---
title: Rich text
order: 6
---

yapyak treats translation and rich text as two different concerns.

Translation is compiled ahead of time. Rich text is rendered at runtime. Keeping those two things separate makes the model simpler, both in how it is implemented and, perhaps more importantly, in how you think about it.

A translated message may still contain named tags:

```ts
t('Read the <link>documentation</link> to get started.')
```

Those tags are part of the message, so a translator can move the linked words wherever the target language wants them. But `t()` doesn't render components. It still produces a string.

To render the tagged parts of that string, use `<RichText>`:

{% code-group %}

```tsx [React]
import { RichText } from '@yapyak/react';
import { t } from 'yapyak';

export function Notice() {
  return (
    <RichText
      source={t('Read the <link>documentation</link> to get started.')}
      link={(children) => <a href="/docs">{children}</a>}
    />
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { RichText } from '@yapyak/vue';
import { t } from 'yapyak';
</script>

<template>
  <RichText :source="t('Read the <link>documentation</link> to get started.')">
    <template #link="{ children }">
      <a href="/docs">{{ children }}</a>
    </template>
  </RichText>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { RichText } from '@yapyak/svelte';
  import { t } from 'yapyak';
</script>

<RichText source={t('Read the <link>documentation</link> to get started.')}>
  {#snippet link(children)}
    <a href="/docs">{children}</a>
  {/snippet}
</RichText>
```

{% /code-group %}

`<RichText>` doesn't depend on translation. It accepts any string. That is kind of the point: `t()` decides what the message says, and `<RichText>` decides how the marked parts of that message are rendered.

And, as the source is statically known, yapyak can also check the named tags for you. In React and Svelte, a `<link>` tag in the source means a matching `link` renderer must be provided, and TypeScript refuses to compile if you forget one. Vue exposes the corresponding slots, but its type system can't require them in the same way.

## In non-component environments

For Astro, server scripts, or plain HTML generation, replace the markers yourself:

```ts
import { t } from 'yapyak';

const html = t('Read the <link>documentation</link> to get started.')
  .replace(/<link>(.+?)<\/link>/, '<a href="/docs">$1</a>');
```
