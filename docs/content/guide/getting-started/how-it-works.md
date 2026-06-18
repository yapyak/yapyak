---
title: How it works
order: 4
---

yapyak is a build-time compiler with a small runtime. When you save a file, yapyak finds the `t()` calls inside it, brings their messages up to date in your locale files, and rewrites the calls so they pick the right value at render time. This page walks through what happens in each of those steps and what ends up in your production bundle.

## The save loop

When you save a source file, yapyak runs through six steps:

1. **Extract.** The right processor parses the file (built-in for `.ts` and `.tsx`, framework-specific for `.vue`, `.svelte`, and `.astro`) and finds the `t()` calls inside.
2. **Validate.** Every call is checked against its source: placeholders match the arguments, plural branches are spelled correctly, the message is a static literal.
3. **Reconcile.** New messages get added to your locale JSON files as empty stubs. Renamed or moved files keep their translations.
4. **Translate.** If a translator is configured, the new stubs are batched and sent to your provider along with their call-site context.
5. **Compile.** The `t()` calls are rewritten into synchronous `_pick()` calls that hold the locale values for that module.
6. **Hot-replace.** Vite pushes the new module to the browser, and the rendered text updates in place.

Most of the loop runs in milliseconds. The translator step adds a few seconds, depending on which model you've configured.

## Extraction

The compiler reads each file through a processor that understands its format. The processor splits the file into scripted parts and template parts so yapyak can parse each with TypeScript and find `t()` calls in the right places.

{% switch group="framework" %}

{% when value="react" %}
```tsx
// .tsx and .jsx — handled by @yapyak/react/processor
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```
{% /when %}

{% when value="vue" %}
```vue
<!-- .vue — handled by @yapyak/vue/processor -->
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
<!-- .svelte — handled by @yapyak/svelte/processor -->
<script lang="ts">
  import { t } from 'yapyak';
</script>

<button>{t('Save changes')}</button>
```
{% /when %}

{% when value="astro" %}
```astro
---
// .astro — handled by @yapyak/astro/processor
import { t } from 'yapyak';
---

<button>{t('Save changes')}</button>
```
{% /when %}

{% /switch %}

A processor isn't framework-specific magic. It's a small adapter that knows how to split a file format into TypeScript-parseable fragments. If yapyak doesn't ship a processor for the file format you need, you can write one through `createProcessor()`.

## What the translator sees

When yapyak sends a new message to the model, it includes context from the call site. By default that's the component name and the immediate element wrapping the `t()` call. You can configure more context (nearby lines, the whole component) or less (just the message), and you can pin glossary terms or pass a voice.

A typical request body looks something like this:

```json
{
  "source": "Save changes",
  "component": "SaveButton",
  "element": "button",
  "voice": "Concise and friendly",
  "glossary": { "cart": { "sv": "kundvagn" } },
  "examples": [{ "en": "Save", "sv": "Spara" }]
}
```

The examples are picked from translations already in your repository. Models tend to keep a consistent voice when they've seen prior choices the project made.

{% callout variant="info" %}
Requests are batched. By default, yapyak groups up to 25 messages per request, runs up to five requests in parallel, and translates every target locale together. Request size, concurrency, and context level are configurable in `yapyak.config.ts`.
{% /callout %}

## What ends up in the locale files

Locale files live in your repository, one per locale, scoped by the source file that owns each message:

```json
// locales/sv.json
{
  "src/components/save-button.tsx": {
    "Save changes": "Spara ändringar"
  }
}
```

The scope is what lets yapyak follow your translations when you move or rename source files. yapyak remembers prior locations in `.yapyak/` and restores translations to the new path on save.

{% callout variant="tip" %}
Locale files are normal JSON. If you need to hand-edit a translation — correct a model's choice, set a tone manually, paste in something from a professional translator — open the file and edit it. yapyak watches those files too and refreshes the browser when they change.
{% /callout %}

## What gets compiled

The runtime cost of yapyak in production is one synchronous picker function. After compile, each `t()` call is rewritten to inline the locale data right where the call sits:

```ts
t('Save changes');
```

becomes:

```ts
_pick({
  en: 'Save changes',
  sv: 'Spara ändringar',
  es: 'Guardar cambios',
});
```

For multi-locale bundles, Vite code-splits these locale objects along with the modules that contain them. A route that doesn't render the Save button never downloads the translations for it.

For single-locale builds, yapyak goes further: it inlines the source literal directly and the picker is tree-shaken away.

```ts
// single-locale build, locale=sv
'Spara ändringar';
```

The bundle ends up with no i18n runtime at all.

## How locale switching propagates

When the user changes locale, only the components that read translations re-render. Components that don't call `t()` are left alone. The mechanism is framework-specific.

{% switch group="framework" %}

{% when value="react" %}
The compiler inserts a `useYapyak()` hook at the top of every function component that calls `t()`. The hook subscribes to the locale store through React's `useSyncExternalStore`, so the component re-renders when the active locale changes.
{% /when %}

{% when value="vue" %}
The active locale lives in a `customRef`. Calling `t()` reads the ref, so any component that calls `t()` re-renders when the locale changes.
{% /when %}

{% when value="svelte" %}
The active locale lives in a `$state` rune. Calling `t()` reads the rune, so any component that calls `t()` re-runs when the locale changes.
{% /when %}

{% when value="astro" %}
Astro pages render on the server with the active locale. Switching locale reloads the page, since Astro doesn't run yapyak's runtime in the browser.
{% /when %}

{% /switch %}

## HMR for translations

Editing a locale file is a special case. yapyak watches your JSON files and, when one changes, sends just the changed entries to the browser over Vite's WebSocket. The runtime updates them in memory and components re-render with the new text.

Source modules aren't recompiled in this case. Component state — open menus, form input, scroll position — stays where it was. This is the same path the automatic save loop takes: when a model returns a translation, yapyak writes it to the locale file and HMR picks it up from there.

{% callout variant="info" %}
For `.astro` files, the page reloads instead. Astro doesn't run yapyak's runtime in the browser, so updates take the form of a fresh server render.
{% /callout %}

## Reuse

yapyak keeps a copy of translations it has seen in `.yapyak/`. When you rename or move a source file, when you remove a component and add it back later, or when you copy markup to a new file, yapyak restores the existing translation under the new location.

Reuse is based on exact match of the source message. yapyak doesn't guess that similar text means the same thing — close-but-not-identical strings are treated as new and get translated again.

{% callout variant="info" %}
When a source message changes in place, yapyak can either keep its existing translation or re-translate from scratch. The behavior is controlled by the `preserveTranslationsOnRename` option in `yapyak.config.ts`. See [Renames](/guide/advanced/renames) for the heuristics.
{% /callout %}

## SSR

The server renders the same compiled modules the client does. There's no separate catalog to load before rendering an interface. Per-request locale binding is set up through a small SSR adapter — see [SSR](/guide/adapters/overview) for the details.
