---
title: Rich text
order: 5
---

Rich text lets a translation wrap part of itself in a link, a line break, an emphasis, or a custom component. You write tags inside the source string and bind them to components at the call site.

```ts
t('Read our <link>privacy policy</link> for details.');
```

The source is still a single string. yapyak parses the tags at compile time, and `<RichText>` calls your handlers to render them.

## Pair tags and void tags

There are two kinds of tags:

**Pair tags** wrap content: `<link>here</link>`, `<strong>important</strong>`. The handler decides what to render around the wrapped children.

**Void tags** stand alone: `<br/>`, `<hr/>`. The handler renders something at that position with no children.

The tags travel with the string into every translation. A translator (or model) moves them to where the meaning lands in each language.

In Swedish the `<link>` wraps a different word:

```json [locales/sv.json]
{
  "Read our <link>privacy policy</link> for details.": "Läs vår <link>integritetspolicy</link> för information."
}
```

## Rendering

Wrap the value in `<RichText>` and pass a handler for each tag in the source.

{% switch group="framework" %}

{% when value="react" %}
```tsx
import { RichText } from '@yapyak/react';
import { t } from 'yapyak';

export function Footer() {
  return (
    <p>
      <RichText
        value={t('Read our <link>privacy policy</link> for details.')}
        link={(children) => <a href="https://example.com/privacy">{children}</a>}
      />
    </p>
  );
}
```

Each pair tag becomes a prop on `<RichText>` named after the tag, accepting `(children: ReactNode) => ReactNode`. Each void tag becomes a no-argument prop returning a `ReactNode`.

TypeScript infers which props are required from the source string. Leave one out and the editor warns you.

For a void tag:

```tsx
<RichText
  value={t('Line one<br/>line two')}
  br={() => <br />}
/>
```
{% /when %}

{% when value="vue" %}
```vue
<script setup lang="ts">
import { RichText } from '@yapyak/vue';
import { t } from 'yapyak';
</script>

<template>
  <p>
    <RichText :value="t('Read our <link>privacy policy</link> for details.')">
      <template #link="{ children }">
        <a href="https://example.com/privacy"><component :is="children" /></a>
      </template>
    </RichText>
  </p>
</template>
```

Each tag becomes a named slot. Pair-tag slots receive `{ children }` — pass it to `<component :is="children" />` to render the inner content. Void-tag slots receive nothing; render whatever should appear at that position.

For a void tag:

```vue
<RichText :value="t('Line one<br/>line two')">
  <template #br>
    <br/>
  </template>
</RichText>
```
{% /when %}

{% when value="svelte" %}
```svelte
<script lang="ts">
  import { RichText } from '@yapyak/svelte';
  import { t } from 'yapyak';
</script>

<p>
  <RichText value={t('Read our <link>privacy policy</link> for details.')}>
    {#snippet link(children)}
      <a href="https://example.com/privacy">{@render children()}</a>
    {/snippet}
  </RichText>
</p>
```

Each tag becomes a snippet prop named after the tag, passed as a `{#snippet ...}` block inside `<RichText>`. Pair-tag snippets receive a `children` snippet — render it with `{@render children()}` to insert the inner content.

For a void tag:

```svelte
<RichText value={t('Line one<br/>line two')}>
  {#snippet br()}<br />{/snippet}
</RichText>
```
{% /when %}

{% when value="astro" %}
```astro
---
import { RichText } from '@yapyak/astro';
import { t } from 'yapyak';
---

<p>
  <RichText value={t('Read our <link>privacy policy</link> for details.')}>
    <a slot="link" href="https://example.com/privacy"><RichText.Children /></a>
  </RichText>
</p>
```

Each tag becomes a named slot. Inside a pair-tag slot, place `<RichText.Children />` where the inner content should render. yapyak replaces it at component render with the inner content. For a void tag, omit the marker.

```astro
<RichText value={t('Line one<br/>line two')}>
  <span slot="br"><br/></span>
</RichText>
```
{% /when %}

{% /switch %}

## Tag names

Tag names start with a letter and continue with letters or digits — no hyphens or underscores. Tags with attributes pass through as literal text (the parser doesn't reject them, but they aren't bound to handlers). Pick semantic names (`link`, `strong`, `name`, `price`) — not HTML element names. The handler picks the element to render.

A tag name only has to exist in the source. `<discount>` and `<callout>` work as long as you provide a handler.

## Validation

Malformed tag markup is flagged at both compile time (as a `$yapyakTypeError` in your editor) and as a [YAP diagnostic](/reference/diagnostics) during dev and CI:

- **[`YAP0041`](/reference/diagnostics/YAP0041) Rich-text tag unclosed.** `<link>terms` has no matching `</link>`.
- **[`YAP0042`](/reference/diagnostics/YAP0042) Rich-text tag mismatched.** `<link>terms</bold>` closes a different tag than the most recent opening.
- **[`YAP0043`](/reference/diagnostics/YAP0043) Rich-text tag unopened.** `terms</link>` has no preceding `<link>`.
- **[`YAP0044`](/reference/diagnostics/YAP0044) Rich-text tag name missing.** `<>` or `</>` has empty brackets.

## Type safety

The set of tags `<RichText>` expects is inferred from the source string at compile time: add `<discount>` to the source and the expected handler set gains `discount`; rename `<link>` to `<a>` and it updates accordingly.

{% switch group="framework" %}

{% when value="react" %}
The handlers are props. Removing a prop whose tag is still in the string is a TypeScript error. Adding a prop for a tag the source doesn't declare is a TypeScript error. You can't ship a missing renderer.
{% /when %}

{% when value="vue" %}
The handlers are slots. Removing a slot whose tag is still in the string is not a compile error: Vue's template tooling has no completeness check for slots, and the tag renders as literal text at runtime. Adding a slot for a tag the source doesn't declare is a TypeScript error.
{% /when %}

{% when value="svelte" %}
The handlers are snippets. Removing a snippet whose tag is still in the string is a TypeScript error. Adding a snippet for a tag the source doesn't declare is a TypeScript error. You can't ship a missing renderer.
{% /when %}

{% when value="astro" %}
The handlers are untyped slots. Removing a slot whose tag is still in the string is not a compile error: the tag renders as literal text at runtime. Adding a slot for a tag the source doesn't declare is ignored.
{% /when %}

{% /switch %}

## Working with the parsed nodes directly

The component covers the common case. If you need to walk the structure yourself, yapyak exports the underlying parser:

```ts
import { parseRichText } from 'yapyak';

const nodes = parseRichText(t('Read our <link>privacy policy</link>.'));
```

`nodes` is `RichTextNode[]`:

```ts
[
  { type: 'text', value: 'Read our ' },
  {
    type: 'pair',
    name: 'link',
    children: [
      { type: 'text', value: 'privacy policy' }
    ]
  },
  { type: 'text', value: '.' }
]
```

Each node is `{ type: 'text', value }`, `{ type: 'pair', name, children }`, or `{ type: 'void', name }`. The structure mirrors what `<RichText>` consumes.
