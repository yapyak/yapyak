---
title: Rich text
order: 6
---

Sometimes a message needs to contain a link, emphasized text, or another interface element.

```ts
t('Read the <link>documentation</link> to get started.')
```

The `<link>` tag belongs in the message because it is part of what the sentence means. A translation may need to move the linked words, just like it may need to move any other part of the sentence.

```
Read the <link>documentation</link> to get started.
Lies zum Einstieg die <link>Dokumentation</link>.
```

What the tag does not say is how that link should be rendered. It might become an `<a>` element in one place, a router link in another, or plain text somewhere else.

This is why yapyak keeps translation and rich text rendering separate.

`t()` translates the message. It is compiled ahead of time and still returns a string:

```ts
const message = t('Read the <link>documentation</link> to get started.');
```

When that message is rendered in a component-based interface, `<RichText>` turns its named tags into the components you provide:

{% code-group %}

```tsx [React]
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

```vue [Vue]
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

```svelte [Svelte]
<script lang="ts">
  import { RichText } from '@yapyak/svelte';
  import { t } from 'yapyak';
</script>

<RichText value={t('Read the <link>documentation</link> to get started.')}>
  {#snippet link(children)}
    <a href="/docs">{children}</a>
  {/snippet}
</RichText>
```

{% /code-group %}

`<RichText>` reads the `<link>...</link>` tag and passes its contents to the `link` renderer. The translated message owns where the linked words appear. The component owns what they become in the interface.

`<RichText>` works well with `t()`, but it is not part of translation. It accepts any string that contains named tags:

```tsx
<RichText
  value="Read the <link>documentation</link> to get started."
  link={(children) => <a href="/docs">{children}</a>}
/>
```

That distinction matters. Translation is concerned with the message and its structure. Rendering is concerned with what that structure becomes on screen. Keeping those jobs separate leaves `t()` small and predictable, while rich text can follow the natural component model of each framework.

## Static tag checking

Although rich text is rendered at runtime, yapyak knows the tag names at authoring time. React and Svelte use that to require a matching renderer for each one. A value containing `<link>...</link>` must be given a `link` renderer:

```tsx
<RichText
  value={t('Read the <link>documentation</link> to get started.')}
/>
// TypeScript error: missing `link` renderer
```

Vue exposes the corresponding named slots. Because of the way Vue types slots, it cannot require those slots in quite the same way as React and Svelte.

## Rendering to a string

A component is not always the output you need. You may be generating HTML on the server, producing markup outside a component tree, or rendering inside an environment where a string is the more natural result.

For those cases, yapyak provides `richText()`. It uses the same named-tag model as `<RichText>`, but its handlers return strings:

```ts
import { richText, t } from 'yapyak';

const html = richText(
  t('Read the <link>documentation</link> to get started.'),
  {
    link: (children) => `<a href="/docs">${children}</a>`,
  },
);
```

The same check applies here. If the message contains `<link>...</link>`, a `link` handler must be provided.

A handler can also remove the markup while keeping the text inside it:

```ts
const text = richText(
  t('Read the <link>documentation</link> to get started.'),
  {
    link: (children) => children,
  },
);
```

The message decides where its named parts belong. The renderer decides what those parts become.
