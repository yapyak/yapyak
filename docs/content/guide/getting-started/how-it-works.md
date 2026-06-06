---
title: How it works
order: 3
---

yapyak includes a small runtime and a build-time compiler. At its core, it is a compiler: during development and build, it extracts messages, keeps translations in sync and compiles translated values into the modules that use them.

## Compile output

For a component with Swedish and Spanish translations:

{% switch group="framework" %}

{% when value="react" %}
```tsx
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

yapyak emits the equivalent of:

{% switch group="framework" %}

{% when value="react" %}
```tsx
import { pick as _pick } from 'yapyak/internal';

export function SaveButton() {
  return (
    <button>
      {_pick({
        en: 'Save changes',
        sv: 'Spara ändringar',
        es: 'Guardar cambios',
      })}
    </button>
  );
}
```
{% /when %}

{% when value="vue" %}
```vue
<script setup lang="ts">
import { pick as _pick } from 'yapyak/internal';
</script>

<template>
  <button>{{ _pick({
    en: 'Save changes',
    sv: 'Spara ändringar',
    es: 'Guardar cambios',
  }) }}</button>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte
<script lang="ts">
  import { pick as _pick } from 'yapyak/internal';
</script>

<button>{_pick({
  en: 'Save changes',
  sv: 'Spara ändringar',
  es: 'Guardar cambios',
})}</button>
```
{% /when %}

{% when value="astro" %}
```astro
---
import { pick as _pick } from 'yapyak/internal';
---

<button>{_pick({
  en: 'Save changes',
  sv: 'Spara ändringar',
  es: 'Guardar cambios',
})}</button>
```
{% /when %}

{% /switch %}

`_pick()` selects the compiled value synchronously. It does not load or query a separate translation catalog.

With no additional locale configured, the same message compiles to its source value:

{% switch group="framework" %}

{% when value="react" %}
```tsx
export function SaveButton() {
  return <button>Save changes</button>;
}
```
{% /when %}

{% when value="vue" %}
```vue
<template>
  <button>Save changes</button>
</template>
```
{% /when %}

{% when value="svelte" %}
```svelte
<button>Save changes</button>
```
{% /when %}

{% when value="astro" %}
```astro
<button>Save changes</button>
```
{% /when %}

{% /switch %}

## Files

yapyak extracts messages from TypeScript and JSX out of the box. Framework-specific file formats (`.vue`, `.svelte`, `.astro`) are handled by [processors](/guide/getting-started/installation#register-framework-processors) registered in `yapyak.config.ts`.

| File type                     | Parsed by                             |
| ----------------------------- | ------------------------------------- |
| `.ts`, `.tsx`, `.jsx`, `.mjs` | Built-in (TypeScript or JSX)          |
| `.vue`                        | `@yapyak/vue/processor`               |
| `.svelte`                     | `@yapyak/svelte/processor`            |
| `.astro`                      | `@yapyak/astro/processor`             |
| Custom format                 | Your own via `createProcessor()`      |

A message inside a template is read as part of that template, not as text in a file. This lets yapyak understand where the message appears and report invalid calls during development or build. Processors define how each format's `<script>`/frontmatter and template expressions are split into TypeScript-parseable fragments.

## Save loop

When a source file changes, yapyak:

1. extracts and validates its messages
2. updates the locale files
3. restores translations it can reuse
4. translates missing entries when a *translator* is configured
5. recompiles the affected module

In development, Vite HMR applies the updated result in the browser. A new translation can appear as part of the same save that added the message.

## Reuse

Translations follow ordinary code changes.

Rename or move a file, and its translations are restored under the new path. Remove translated markup and add it back later, and yapyak restores the translations it already has.

Removed translations are kept locally in `.yapyak/`.

When a source message changes in place, yapyak can either preserve its existing translation or create an empty entry for translation again. Preserving is useful for small edits. Translating again is safer when the meaning may have changed.

Restoration is based on exact messages and known code changes. yapyak does not guess that similar text has the same meaning.

## Context

A message such as `Remove` may mean removing a filter in one component and deleting a project in another.

When a missing entry is sent to a *translator*, yapyak can include context from the code that uses it:

```json
{
  "source": "Save changes",
  "component": "SaveButton",
  "element": "button"
}
```

The amount of context is configurable. You can send only the message, include nearby usage context, or include more surrounding source code.

A request can also include glossary terms and existing translations as examples.

## Requests

Missing translations are grouped into requests to your configured AI provider.

By default, one request can contain up to 25 source messages, with all target locales translated together. Up to five requests can run at the same time. Request size, concurrency and context are configurable.

Before a request is sent, yapyak reuses translations it already knows. Only missing translation work is sent to the model.

Requests go directly to your AI provider using your own API key. No yapyak service receives or forwards their content.

Locale files are stored in your repository. Translation memory and request cache are stored locally in `.yapyak/`.

During normal development, automatic translation on save is limited to small changes. By default, a save that adds more than 20 new messages updates the locale files but leaves translation to an explicit CLI run.

## Bundles

Translated values are compiled into the modules that render them.

If a settings route contains translated messages, those messages are included with the settings route code. A user who does not load that route does not download its translations as part of the initial bundle.

Once a module is loaded, changing locale is synchronous because its translated values are already present.

## SSR

Server rendering uses the same compiled values as client rendering.

The server selects the value for the active locale from the modules it renders. It does not need to load a separate translation catalog before rendering the interface.
