---
title: Rich text
order: 6
---

yapyak treats rich text and translation as two different concerns. Translation happens at compile time. Rich text happens at runtime. Keeping those two things separate makes the model much simpler, both in how it is implemented and, perhaps more importantly, in how you think about it.

yapyak ships a `<RichText>` component for React, Vue, and Svelte:

{% code-group %}

```tsx [React]
import { RichText } from '@yapyak/react';
import { t } from 'yapyak';

export function Notice() {
  return (
    <RichText
      source={t('Click <link>here</link> to continue.')}
      link={(children) => <a href="/next">{children}</a>}
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
  <RichText :source="t('Click <link>here</link> to continue.')">
    <template #link="{ children }">
      <a href="/next">{{ children }}</a>
    </template>
  </RichText>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { RichText } from '@yapyak/svelte';
  import { t } from 'yapyak';
</script>

<RichText source={t('Click <link>here</link> to continue.')}>
  {#snippet link(children)}
    <a href="/next">{children}</a>
  {/snippet}
</RichText>
```

{% /code-group %}

It scans the source for `<tag>...</tag>` markers and replaces them with the components you pass in. The tag names are entirely up to you — `<bold>`, `<link>`, `<emoji>`, anything that helps you make sense of the string.

In React and Svelte, those tags are required props. TypeScript reads the source at compile time and refuses to compile if you forget one. Vue can't enforce the same thing through its template system, so the tags are listed as available but not required. If you forget one in Vue, the literal `<link>...</link>` ends up in the rendered output.

You don't have to pass a `t()` string either. `<RichText>` works on any string at all, which is the whole point of keeping the two systems apart:

```tsx
<RichText
  source="Click <bold>here</bold> to continue."
  bold={(children) => <strong>{children}</strong>}
/>
```

## In non-component environments

For Astro, server scripts, or plain HTML generation, replace the markers yourself:

```ts
import { t } from 'yapyak';

const html = t('Click <link>here</link> to continue.')
  .replace(/<link>(.+?)<\/link>/, '<a href="/next">$1</a>');
```
