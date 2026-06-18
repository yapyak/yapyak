---
title: How it works
order: 4
---

yapyak is a compile-time compiler with a small runtime. When you save a file, yapyak finds the `t()` calls inside it, brings their messages up to date in your locale files, and rewrites the calls so they pick the right value at render time. This page walks through what happens in each of those steps and what ends up in your production bundle.

## The save loop

When you save a source file, yapyak runs through six steps:

1. **Extract.** The right processor parses the file (built-in for `.ts` and `.tsx`, framework-specific for `.vue`, `.svelte`, and `.astro`) and finds the `t()` calls inside.
2. **Validate.** Every call is checked against its source: placeholders match the arguments, plural branches are spelled correctly, the message is a static literal.
3. **Reconcile.** New messages get added to your locale files as empty stubs. Renamed or moved files keep their translations.
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

A processor is a small adapter that knows how to split a file format into TypeScript-parseable fragments. If yapyak doesn't ship a processor for the file format you need, you can write one through `createProcessor()`.

## What the translator sees

When yapyak sends a new message to the model, it includes context from the call site. By default that's the component name and the immediate element wrapping the `t()` call. You can configure more context (nearby lines, the whole component) or less (just the message), and you can pin glossary terms or pass a voice.

A typical request body looks something like this:

```json
{
  "component": "SaveButton",
  "element": "button",
  "examples": [
    {
      "en": "Save",
      "sv": "Spara",
    },
  ],
  "glossary": {
    "cart": { "sv": "kundvagn" },
  },
  "source": "Save changes",
  "voice": "Concise and friendly",
}
```

The examples are picked from translations already in your repository. Models tend to keep a consistent voice when they've seen prior choices the project made.

{% callout variant="info" %}
Requests are batched. By default, yapyak groups up to 25 messages per-request, runs up to five requests in parallel, and translates every target locale together. Request size, concurrency, and context level are configurable in `yapyak.config.ts`.
{% /callout %}

## What ends up in the locale files

Locale files live in your repository, one per locale, scoped by the source file that owns each message:

```json [locales/sv.json]
{
  "src/components/save-button.tsx": { "Save changes": "Spara ändringar" }
}
```

The scope is what lets yapyak follow your translations when you move or rename source files. yapyak remembers prior locations in `.yapyak/` and restores translations to the new path on save.

{% callout variant="tip" %}
Locale files are normal JSON. If you need to hand-edit a translation — correct a model's choice, set a tone manually, paste in something from a professional translator — open the file and edit it. yapyak watches those files too and refreshes the browser when they change.
{% /callout %}

## What gets compiled

After compile, each `t()` call is rewritten to pick the right locale at render time. The compiler deduplicates imports, catalogs, and factory references across the module so the bundle stays small even with many `t()` calls.

A multi-locale source file:

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
  placeholder as _placeholder,
} from 'yapyak/internal';

const _catalog_$0 = {
  en: 'Save',
  sv: 'Spara',
};
const _catalog_$1 = {
  en: [_literal('Hi '), _placeholder('name')],
  sv: [_literal('Hej '), _placeholder('name')],
};

_pick(_catalog_$0);
_pick(_catalog_$0);

_pick(_catalog_$1, { name });
_pick(_catalog_$1, { name });
```

Three things happen:

- **Factory imports are deduplicated** into a single `import` at module scope. Only the factories this module uses are imported — a module with just plain strings imports neither `_placeholder` nor `_literal`.
- **Identical catalogs are shared.** Both `t('Save')` calls reference the same `_catalog_$0`; the catalog object is declared once.
- **Vite code-splits these catalog objects** with the modules that contain them. A route that doesn't render a translation never downloads it.

**Single-locale.** When only one locale ends up in the bundle — because that's the only one you've added, or because you've set [`fixedLocale`](/guide/getting-started/configuration#fixed-locale-builds) — the compiler skips `_pick`, the factory imports, and the catalog objects entirely. Each `t()` call collapses to whatever value the active locale has on disk (or to the source string if there's no translation):

```ts
// fixedLocale: 'sv', with a Swedish translation present:
t('Save changes');
// becomes: 'Spara ändringar'

// no translation needed — the source survives as a template literal:
t('Hello {name}', { name });
// becomes: `Hello ${name}`
```

And in JSX, the call disappears into the surrounding markup:

```tsx
<p>{t('Welcome')}</p>
// becomes: <p>Welcome</p>
```

The bundle ships with no i18n runtime at all.

**Formatters use `Intl` directly.** A date, number, or list format compiles to a factory that calls the platform's `Intl` API at render time — no ICU library is bundled:

```ts
t('Posted on {date, date, long}', { date });
// catalog entry: _date('date', 'long')
// at render time:     new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date)
```

**Plurals and selects stay as runtime structures** because branch selection depends on the active locale and the parameter value:

```ts
t('{count, plural, one {# message} other {# messages}}', { count });
// catalog entry: _plural('count', 'cardinal', { one: [...], other: [...] })
// at render time:     branch picked through Intl.PluralRules.select()
```

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

## Translation safety

yapyak runs through four guarantees on every save to keep translations from being lost or overwritten silently.

**The orphan cache.** Every translation yapyak has ever seen lives in `.yapyak/orphans.json`. Delete a component, add it back three months later, copy markup to a new file — the translations re-appear in `locales/<locale>.json` automatically. The cache has no expiration. Reuse is based on exact match of the source string; close-but-not-identical strings are treated as new.

**Rename detection.** When you edit a source string in place (`'Save'` → `'Save changes'`), yapyak compares positions in the file to tell a rename apart from a delete-and-add, and preserves the existing translation under the new key. The behavior is controlled by [`preserveTranslationsOnRename`](/guide/getting-started/configuration#preservetranslationsonrename); see [Renames](/guide/advanced/renames) for the heuristics.

**The invariant barrier.** Before any locale file is written, yapyak compares the new state against the existing one. If a write would clear a non-empty stub for a string still present in your source, the write is refused and yapyak surfaces the violation as an error instead of going through with it. There is no path where a still-used translation silently vanishes.

**Atomic multi-file writes.** When yapyak updates several locale files from a single save, all of them are staged to temp files first and renamed into place only once every stage has succeeded. A crash, an SSD failure, or a Ctrl-C mid-write leaves your original locales untouched.

The only path that re-translates an already-filled entry is `yapyak translate --force`. That's a deliberate escape hatch behind an explicit CLI flag.

## SSR

The server renders the same compiled modules the client does. There's no separate catalog to load before rendering an interface. Per-request locale binding is set up through a small SSR adapter — see [SSR](/guide/adapters/overview) for the details.
