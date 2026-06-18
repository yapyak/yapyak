---
title: Overview
order: 1
---

`t()` is the function you wrap around any text that should be translatable. The string you wrap becomes the source string as well as the key for its translations.

```ts
import { t } from 'yapyak';

t('Save changes');
```

That's the smallest possible usage. yapyak picks it up on save, makes sure each target locale file has an entry for it, and replaces the call at compile time with a synchronous lookup of the right locale's value.

## Where you write `t()`

Anywhere TypeScript or JavaScript runs in your project. The compiler scans the file types your [processors](/guide/getting-started/installation) register — `.ts` and `.tsx` by default, plus `.vue`, `.svelte`, `.astro`, or anything else you've added.

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

The framework binding handles the reactivity for you. When the user switches locale, every component that called `t()` re-renders with the new copy — see [How it works](/guide/getting-started/how-it-works) for the mechanism per framework.

## The source string is the key

The English (or whatever your `defaultLocale` is) text you pass to `t()` is what every locale file uses as its key. There's no parallel naming convention to maintain:

```json [locales/sv.json]
{
  "src/components/save-button.tsx": { "Save changes": "Spara ändringar" }
}
```

The conversation between code and locale file is direct: read the file, see exactly what English shows up where. Edit the source string in your component and yapyak follows it — either keeping the translation or marking it for re-translation depending on your [`preserveTranslationsOnRename`](/guide/getting-started/configuration) setting.

## What the compiler checks

Every save runs `t()` calls through a parser. Anything ambiguous becomes a [diagnostic](/guide/advanced/diagnostics) — a compile-time warning or error you'll see in your editor and in your terminal.

The most common ones are early-flagged mistakes:

- `t()` with no arguments at all — there's nothing to translate
- `t('')` — an empty string can't be a source string
- `t(`Hello ${name}`)` — dynamic source strings can't be extracted; use a [placeholder](/guide/writing/params) instead
- `t(someVariable)` — same reason; the source has to be a static literal

The compiler can only translate what it can see at compile time. Anything dynamic — a string built from variables, computed from data, looked up at runtime — has to be expressed through ICU placeholders or a select branch, not concatenation.

## What you get back

`t()` returns a string. If your source contains [rich-text tags](/guide/writing/rich-text) (`<link>...</link>` or `<br/>`), the return type is branded so `<RichText>` accepts it as input. The branding is a signal — render through `<RichText>` rather than as plain text, or the tags appear verbatim.

For everything else, `t()` is a `string`. You can interpolate it, pass it as a prop, log it, store it. It behaves like the literal you'd have written in a single-language version of the same component.

## The whole API

`t()` is the entry point. Two methods chain off it:

| Form | Purpose | See |
|---|---|---|
| `t(source)` | Translate for the active locale | this page |
| `t(source, params)` | Translate with placeholder values | [Params](/guide/writing/params) |
| `t.as(context, source)` | Disambiguate identical sources with different meanings | [Homonyms](/guide/writing/homonyms) |
| `t.in(locale, source)` | Force a specific locale for one call | [Overrides](/guide/writing/overrides) |

You'll use the plain form 95% of the time. The other two are there for the moments when the simple model isn't enough.

## What's outside `t()`

For values outside a `t()` call — prices, dates, list separators — yapyak ships a [`format`](/guide/formatting/overview) namespace built on `Intl`.
