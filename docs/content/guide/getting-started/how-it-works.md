---
title: How it works
order: 3
---

yapyak works at two moments: on save, and on build. On save it keeps your locale files in step with your code. On build it compiles each `t()` into the module that renders it. This page follows one message through both.

{% switch group="framework" %}

{% when value="react" %}
```tsx [src/components/save-button.tsx]
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```
{% /when %}

{% when value="vue" %}
```vue [src/components/save-button.vue]
<script setup lang="ts">
import { t } from 'yapyak';
</script>

<template>
  <button>{{ t('Save changes') }}</button>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte [src/components/save-button.svelte]
<script lang="ts">
  import { t } from 'yapyak';
</script>

<button>{t('Save changes')}</button>
```
{% /when %}

{% when value="astro" %}
```astro [src/components/save-button.astro]
---
import { t } from 'yapyak';
---

<button>{t('Save changes')}</button>
```
{% /when %}

{% /switch %}

## Save loop

When you save, yapyak reacts in one synchronous pass: it reads the file through a
[processor](#processors), finds the `t()` calls, checks each one, and updates
your locale files. A call yapyak can't compile is reported before the save settles.

```ts
t('Save changes');           // ok
t(label);                    // error: source must be a static string
t('Hi {name}', { user });    // error: missing 'name'
```

A new message is added to your locale files as an empty stub, keyed by the source string.

{% switch group="framework" %}

{% when value="react" %}
```json [locales/sv.json]
{
  "src/components/save-button.tsx": {
    "Save changes": ""
  }
}
```
{% /when %}

{% when value="vue" %}
```json [locales/sv.json]
{
  "src/components/save-button.vue": {
    "Save changes": ""
  }
}
```
{% /when %}

{% when value="svelte" %}
```json [locales/sv.json]
{
  "src/components/save-button.svelte": {
    "Save changes": ""
  }
}
```
{% /when %}

{% when value="astro" %}
```json [locales/sv.json]
{
  "src/components/save-button.astro": {
    "Save changes": ""
  }
}
```
{% /when %}

{% /switch %}

Translation is a separate, slower beat, and yapyak does not wait for it. With a
[translator](/guide/translating/overview) configured, the new stubs go off in the
background while you keep working. When the model answers, the text is written to the same file and the running app updates through [HMR](/guide/advanced/hmr).

{% switch group="framework" %}

{% when value="react" %}
```json [locales/sv.json]
{
  "src/components/save-button.tsx": {
    "Save changes": "Spara ändringar"
  }
}
```
{% /when %}

{% when value="vue" %}
```json [locales/sv.json]
{
  "src/components/save-button.vue": {
    "Save changes": "Spara ändringar"
  }
}
```
{% /when %}

{% when value="svelte" %}
```json [locales/sv.json]
{
  "src/components/save-button.svelte": {
    "Save changes": "Spara ändringar"
  }
}
```
{% /when %}

{% when value="astro" %}
```json [locales/sv.json]
{
  "src/components/save-button.astro": {
    "Save changes": "Spara ändringar"
  }
}
```
{% /when %}

{% /switch %}

Save a new string and it renders in your source language at once. A second or two later, the Swedish arrives on its own.

Until it does, the entry is an empty stub, and yapyak treats an empty value as absent: it renders the source string instead. A reader who already switched to Swedish sees the English for that second, not an empty slot. The same fallback covers any string you have not translated yet.

Save again before translation finishes and the request in flight is cancelled, so only the code you currently have is sent. A save that adds more new strings than
[`autoTranslateThreshold`](/guide/translating/loop) writes the stubs and holds the
translator back, which keeps one careless paste from spending an API budget at once.

## Processors

yapyak reads each file through a processor that understands its format. The processor splits the file into TypeScript-parseable fragments so the compiler finds `t()` calls in the right places. Register one per framework:

```ts [yapyak.config.ts]
import { react } from '@yapyak/react/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  processors: [react()]
});
```

The same call, in each format a processor knows how to open:

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

The built-in processor handles `.ts`, `.tsx`, and the rest of the JavaScript family. `.vue`, `.svelte`, and `.astro` each have their own. For a format yapyak doesn't ship, `createProcessor` from `yapyak/processor` builds one.

## Context

yapyak extracts each message together with the component and element around it, plus a snippet of the surrounding code:

```ts
{
  source: 'Save changes',
  context: {
    enclosingComponent: 'SaveButton',
    enclosingElement: 'button',
    snippet: "<button>{t('Save changes')}</button>"
  }
}
```

The element tells the model it is translating a button label rather than prose, the component names the surface it belongs to, and the snippet shows the element as it appears in your file. How much of this travels with each request is a setting. See
[Context](/guide/translating/context) for the levels and
[Examples](/guide/translating/examples) for how yapyak seeds the model with
translations you already made.

## Locale files

Locale files live in your repository, one per locale. Each message is nested under the source file that owns it:

{% switch group="framework" %}

{% when value="react" %}
```json [locales/sv.json]
{
  "src/components/checkout.tsx": {
    "Checkout": "Kassa"
  },
  "src/components/save-button.tsx": {
    "Save changes": "Spara ändringar"
  }
}
```
{% /when %}

{% when value="vue" %}
```json [locales/sv.json]
{
  "src/components/checkout.vue": {
    "Checkout": "Kassa"
  },
  "src/components/save-button.vue": {
    "Save changes": "Spara ändringar"
  }
}
```
{% /when %}

{% when value="svelte" %}
```json [locales/sv.json]
{
  "src/components/checkout.svelte": {
    "Checkout": "Kassa"
  },
  "src/components/save-button.svelte": {
    "Save changes": "Spara ändringar"
  }
}
```
{% /when %}

{% when value="astro" %}
```json [locales/sv.json]
{
  "src/components/checkout.astro": {
    "Checkout": "Kassa"
  },
  "src/components/save-button.astro": {
    "Save changes": "Spara ändringar"
  }
}
```
{% /when %}

{% /switch %}

The path key is what lets yapyak follow a translation when you move or rename the source file. The files are plain JSON.

{% callout variant="tip" %}
Open a locale file next to the running app and edit a value by hand to correct the model, tune tone, or paste in a professional translation. yapyak watches the file and updates the browser through HMR.
{% /callout %}

## Compile

The `t()` you write is not what ships. When Vite builds a module, yapyak rewrites every `t()` in it to a synchronous lookup over an inline catalog. A file with two locales:

```ts
import { t } from 'yapyak';

t('Save');

t('Save');

t('Hi {name}', { name });

t('Hi {name}', { name });
```

compiles to:

```ts
import {
  pick as _pick,
  literal as _literal,
  placeholder as _placeholder
} from 'yapyak/internal';

const _variants_$0 = {
  en: 'Save',
  sv: 'Spara'
};

const _variants_$1 = {
  en: [_literal('Hi '), _placeholder('name')],
  sv: [_literal('Hej '), _placeholder('name')]
};

_pick(_variants_$0);

_pick(_variants_$0);

_pick(_variants_$1, { name });

_pick(_variants_$1, { name });
```

Identical calls share one catalog object, and the factory imports fold into a single `import` at module scope. Vite code-splits each catalog with the module that holds it, so a route that never renders a message never downloads it.

### Single locale

When only one locale reaches the bundle, because it is the only one you added or because you set [`fixedLocale`](/guide/advanced/fixed-locale), the picker, the imports, and the catalogs all disappear. Each `t()` collapses to the value on disk.

With `fixedLocale: 'sv'` and a Swedish translation present:

```ts
t('Save changes');
```

compiles to:

```ts
'Spara ändringar'
```

A message with parameters collapses to a template literal:

```ts
t('Hello {name}', { name });
```

compiles to:

```ts
`Hello ${name}`
```

Inside markup, the call disappears into the surrounding text:

{% switch group="framework" %}

{% when value="react" %}
```tsx
<p>{t('Welcome')}</p>
```

compiles to:

```tsx
<p>Welcome</p>
```
{% /when %}

{% when value="vue" %}
```vue
<p>{{ t('Welcome') }}</p>
```

compiles to:

```vue
<p>Welcome</p>
```
{% /when %}

{% when value="svelte" %}
```svelte
<p>{t('Welcome')}</p>
```

compiles to:

```svelte
<p>Welcome</p>
```
{% /when %}

{% when value="astro" %}
```astro
<p>{t('Welcome')}</p>
```

compiles to:

```astro
<p>Welcome</p>
```
{% /when %}

{% /switch %}

Nothing from yapyak's runtime is left in the output.

### Formatters

A date, number, or list compiles to a factory that calls the platform's `Intl` at render time. No ICU library is bundled.

```ts
t('Posted on {date, date, long}', { date });
```

The catalog entry is `_date('date', 'long')`, which resolves to `new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date)`.

### Plurals and selects

A plural or select stays a runtime structure, because the branch depends on the active locale and the value:

```ts
t('{count, plural, one {# message} other {# messages}}', { count });
```

The catalog entry is `_plural('count', 'cardinal', { one: [...], other: [...] })`. At render time the branch is chosen through `Intl.PluralRules.select()`.

## Safety

Every save that touches a locale file passes two checks that make silent loss hard.

Before writing, yapyak compares the new file against the old. If a write would erase a translation for a source string still in your code, yapyak stops and shows the conflict instead.

When one save updates several locale files, each is staged to a temporary file first and renamed into place only after all of them have been staged. A crash or a Ctrl-C mid-write leaves your committed locales untouched.

A filled entry is only ever re-translated when you ask for it, through
[`yapyak translate --force`](/guide/translating/coverage). For how yapyak carries
translations across renames, moves, and deletions, see
[Renames](/guide/translating/renames).

## Switching

Because the translations are compiled into the modules, a locale change is a re-render, not a fetch. When the active locale changes, the components that call `t()` re-render, along with their children; components outside those subtrees are left alone. The processor wires that subscription in at compile time, through each framework's own reactivity.

{% switch group="framework" %}

{% when value="react" %}
The compiler injects a `useYapyak()` hook at the top of every component that calls `t()`. It subscribes to the locale store through React's `useSyncExternalStore`, so the component re-renders when the active locale changes.
{% /when %}

{% when value="vue" %}
The active locale lives in a `customRef`. A component that calls `t()` reads it and is registered as a subscriber, so it re-renders when the locale changes.
{% /when %}

{% when value="svelte" %}
The active locale is a `$state` rune. A component that calls `t()` reads it, so it re-runs when the locale changes.
{% /when %}

{% when value="astro" %}
Astro renders on the server and runs no yapyak runtime in the browser, so switching the locale reloads the page.
{% /when %}

{% /switch %}

See [Switch](/guide/switching/switch) for the binding you call in a component.

## SSR

On the server, the same compiled modules render. There is no separate catalog to load first. A small adapter binds each request to its own locale, so one user's language never leaks into another's.

```ts
import { withResponse } from 'yapyak/adapter';

await withResponse(request, async () => {
  return await render(request);
});
```

See [Installation](/guide/getting-started/installation) for per-framework setup and
[Custom adapter](/guide/advanced/custom-adapter) for frameworks yapyak doesn't
ship.
