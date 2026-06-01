---
title: Rich text
order: 6
---

Rich text and translation are different problems in yapyak.

Translation is a compile-time concern: extract the strings, store them per locale, emit the right one when the bundle ships. Rich text is a runtime concern: take a string with markers in it and turn the markers into actual components when the page renders.

Keeping the two apart means the `t()` pipeline never has to think about JSX, and your components never have to think about how the string got translated. The string flows through one system. The markers are picked up by another.

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

`<RichText>` scans the `source` for `<tag>...</tag>` patterns and substitutes the matching prop or snippet you've passed in. The tag names are arbitrary. `<bold>`, `<link>`, `<emoji>`, `<icon>` — yapyak has no fixed vocabulary, it looks up whatever names appear in the string.

In React and Svelte, the tags are required: TypeScript reads the source string at compile time, extracts the tag names, and refuses to compile if any are missing. Vue can't enforce this through its template system, so the tags are listed as available but optional. Forgetting one doesn't trigger a compile error in Vue.

## Works with any string

The `source` doesn't have to come from `t()`. `<RichText>` takes whatever you give it:

```tsx
<RichText
  source="Click <bold>here</bold> to continue."
  bold={(children) => <strong>{children}</strong>}
/>
```

This is the upshot of keeping rich text and translation in different boxes. One system produces strings, the other renders them. Neither depends on the other.

## Outside React, Vue, and Svelte

In non-component environments like Astro pages, server scripts, or HTML generation, there's no `<RichText>` to reach for. We recommend replacing the markers directly:

```ts
import { t } from 'yapyak';

const html = t('Click <link>here</link> to continue.')
  .replace(/<link>(.+?)<\/link>/, '<a href="/next">$1</a>');
```

The translation step is the same. The render step is whatever your environment provides.
