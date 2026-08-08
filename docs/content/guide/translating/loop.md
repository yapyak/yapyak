---
title: Loop
order: 2
---

yapyak's save loop runs during development. New `t()` calls appear; their translations appear in the running browser a second or two later.

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
```vue [src/components/empty-cart.vue]
<script setup lang="ts">
import { t } from 'yapyak';
</script>

<template>
  <p>{{ t('Your cart is empty') }}</p>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte [src/components/empty-cart.svelte]
<script lang="ts">
  import { t } from 'yapyak';
</script>

<p>{t('Your cart is empty')}</p>
```
{% /when %}

{% when value="astro" %}
```astro [src/components/empty-cart.astro]
---
import { t } from 'yapyak';
---

<p>{t('Your cart is empty')}</p>
```
{% /when %}

{% /switch %}

See [How it works](/guide/getting-started/how-it-works) for the full step sequence and [HMR](/guide/advanced/hmr) for the hot-replace mechanics. This page covers the translator's role in that loop.

## Threshold

A single save that adds more than `autoTranslateThreshold` new strings skips auto-translation. yapyak writes the empty stubs and logs that the translator was skipped. Run [`yapyak translate`](/guide/translating/coverage) when you're ready.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  autoTranslateThreshold: 20
});
```

Default is `20`. Set it to `0` to disable auto-translation entirely (you run [`yapyak translate`](/reference/cli/translate) when you're ready); set it to a large number to never skip.

This catches large refactors and agent-generated additions that would otherwise spend your API budget in one save.

## Adding a locale

Adding a locale with `yapyak add sv` runs the translator over every existing source string in one batch rather than waiting for them to come in on save. See [Coverage](/guide/translating/coverage).

## Locale-file edits

A direct edit to `locales/sv.json` follows a separate sub-second path that diffs the file and updates the runtime in place. See [HMR](/guide/advanced/hmr#locale-file-save-loop).
