---
title: Overview
order: 1
---

[`t()`](/reference/yapyak/t) wraps any text that should be translatable. The string you wrap becomes the source string as well as the key for its translations.

```ts
import { t } from 'yapyak';

t('Save changes');
```

## Where you write `t()`

Anywhere TypeScript or JavaScript runs in your project. The compiler scans the file types your [processors](/guide/getting-started/installation) register. `.ts` and `.tsx` by default, plus `.vue`, `.svelte`, `.astro`, or anything else you've added.

{% switch group="framework" %}

{% when value="react" %}
```tsx
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```
{% /when %}

{% when value="vue" %}
```vue
<script setup lang="ts">
import { t } from 'yapyak';
</script>

<template>
  <button>{{ t('Save changes') }}</button>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte
<script lang="ts">
  import { t } from 'yapyak';
</script>

<button>{t('Save changes')}</button>
```
{% /when %}

{% when value="astro" %}
```astro
---
import { t } from 'yapyak';
---

<button>{t('Save changes')}</button>
```
{% /when %}

{% /switch %}

## The source string is the key

The English (or whatever your `defaultLocale` is) text you pass to `t()` is what every locale file uses as its key. There's no parallel naming convention to maintain:

```json [locales/sv.json]
{
  "src/components/save-button.tsx": {
    "Save changes": "Spara ändringar"
  }
}
```

Open the file and you see exactly which source string is used where. Edit the source string in your component and yapyak follows it. Depending on [`preserveTranslationsOnRename`](/guide/getting-started/configuration), the existing translation is kept or marked for re-translation.

## What the compiler checks

Every save runs `t()` calls through a parser. Anything ambiguous becomes a [diagnostic](/reference/diagnostics) — a compile-time warning or error you'll see in your editor and in your terminal.

The most common ones are early-flagged mistakes:

- `t()` with no arguments: there's nothing to translate.
- `t('')`: an empty string can't be a source string.
- `` t(`Hello ${name}`) ``: dynamic source strings can't be extracted; use a [placeholder](/guide/writing/params) instead.
- `t(someVariable)`: same reason; the source has to be a static literal.

The compiler can only translate what it can see at compile time. Anything dynamic (a string built from variables, computed from data, looked up at runtime) has to be expressed through ICU placeholders or a select branch, not concatenation.

## The whole API

`t()` is the entry point. Two methods chain off it:

| Form | Purpose | See |
|---|---|---|
| `t(source)` | Translate for the active locale | this page |
| `t(source, params)` | Translate with placeholder values | [Params](/guide/writing/params) |
| `t.as(context, source)` | Disambiguate identical sources with different meanings | [Homonyms](/guide/writing/homonyms) |
| `t.in(locale, source)` | Force a specific locale for one call | [Overrides](/guide/writing/overrides) |

