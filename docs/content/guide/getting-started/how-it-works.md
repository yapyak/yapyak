---
title: How it works
order: 3
---

yapyak is a build-time compiler with a small runtime. You write source strings where they belong: in the component, route, or module that renders them. During development and build, yapyak extracts those strings, keeps translations in sync, and compiles each translated variant back into the module that uses it.

At render time, the runtime has one job: return the variant for the active locale.

This is the central design choice in yapyak. Translations do not live in a global catalog that the application has to locate, load, and query at runtime. They stay attached to the code that gives them meaning, and they are split into the same chunks as that code.

## The compile transform

Given this component:

```tsx
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

with `sv` and `es` configured, yapyak emits the equivalent of:

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

The translated variants are compiled into the same module as `SaveButton`. `_pick()` reads the active locale and returns the appropriate value synchronously. It does not resolve a key against a separate catalog, and it does not introduce a loading step between the component and the string it renders.

This also makes incremental adoption unusually cheap. With no additional locale configured, the same call compiles down to its source string:

```tsx
export function SaveButton() {
  return <button>Save changes</button>;
}
```

Until a project adds another language, there is no runtime locale selection to ship for that string. You can start writing translatable UI before localization becomes a release requirement, without creating a migration project for later.

## Frameworks are parsed as frameworks

A translation call is only useful if the compiler understands where it appears. A call inside a Vue template is not plain JavaScript text. Neither is one inside a Svelte component or Astro frontmatter.

yapyak processes each supported file type through the toolchain that understands its syntax:

| File type | Parser |
| --- | --- |
| `.ts`, `.tsx`, `.jsx`, `.mjs` | TypeScript compiler |
| `.vue` | `@vue/compiler-sfc` and `@vue/compiler-core` |
| `.svelte` | `svelte/compiler` |
| `.astro` | `@astrojs/compiler/sync` |

For Vue, Svelte, and Astro, executable TypeScript regions are passed through the same TypeScript extraction pipeline used for ordinary modules. Template expressions are discovered through the framework parser first, then inspected for `t()` calls.

That distinction matters. Templates have their own scope rules, expression boundaries, blocks, slots, and component syntax. Parsing them as text would make the common case look simple and the edge cases unreliable. yapyak supports React, Vue, Svelte, Astro, and plain TypeScript as source formats in their own right.

## What happens when a file changes

During development, the Vite plugin handles each relevant file change as a small synchronization pass.

### 1. Extract calls and validate them

yapyak parses the changed file and collects its `t()` calls together with information about where each call appears: the source string, file position, surrounding code, and enclosing element where available.

Static diagnostics run at this point. Dynamic source strings (`YPK102`), missing parameters (`YPK104`), extra parameters (`YPK105`), spread parameters (`YPK106`), invalid plural patterns (`YPK202`), empty sources (`YPK103`), and other malformed calls are reported during development or build rather than becoming localization bugs in a running application.

### 2. Preserve translations across ordinary edits

When a source string changes at the same line and column as an existing call, yapyak can recognize the edit as a rename rather than treating it as an unrelated deletion and addition.

Changing:

```tsx
t('Save')
```

to:

```tsx
t('Save changes')
```

in place produces a locale-file diff shaped like this:

```diff
{
  "src/components/save-button.tsx": {
-    "Save": "Spara",
+    "Save changes": "Spara"
  }
}
```

The handling of non-default locales depends on the workflow:

| Configuration | Rename behavior |
| --- | --- |
| `preserveTranslationsOnRename: true` | The existing translation is moved to the new source string |
| `preserveTranslationsOnRename: false` | The new source string receives an empty entry and can be translated again |

Without a configured *translator*, preserving an existing translation is usually the least surprising behavior. With a *translator* configured, translating again is often safer: a small wording change in the source language may carry a meaningful change in intent.

Rename matching is deliberately strict. If a call moves and changes text in the same save, yapyak treats it as a removed message and a new message. Guessing based on string similarity would make edits appear convenient while creating a much worse failure mode: attaching a valid translation to the wrong meaning.

### 3. Synchronize locale files

After extraction and rename detection, yapyak updates the locale files. New messages receive entries in each configured locale. Removed messages are pruned. Files are written atomically and in stable order, so the Git diff reflects the source change rather than incidental rewriting.

Locale files remain ordinary project files. They can be reviewed, edited, versioned, and restored with the same tools as the rest of the codebase.

### 4. Translate missing entries when configured

When a *translator* is configured, new missing entries can be translated as part of the save loop. Each translation request includes the source message and, depending on configuration, the context collected from its call site.

When no *translator* is configured, the synchronization still happens. The new locale entries remain empty until they are filled by hand or through the CLI.

### 5. Recompile and update the running app

Once locale data is current, Vite reruns the transform with the updated variants. In development, yapyak sends custom events over Vite's WebSocket connection — `yapyak:locale-added` and `yapyak:locale-removed` — and the runtime listens for them via `import.meta.hot.on()` to update its active locale state.

The result is that a translated edit can appear in the running application as part of the same save cycle, without requiring a page reload or a separate catalog refresh.

## Context comes from the code

A source string is often enough to locate a translation, but not always enough to translate it well. A short message such as `Save`, `Open`, or `Close` can mean different things depending on where it appears.

For a missing translation, yapyak can construct context from the call site:

```json
{
  "source": "Save changes",
  "component": "SaveButton",
  "element": "button",
  "snippet": "  return (\n    <button>{t('Save changes')}</button>\n  );"
}
```

`component` is derived from the source file, `element` is the nearest relevant template or JSX element, and `snippet` contains nearby code around the call.

This is one of the practical advantages of keeping the source message in the component. The component already describes what the string is doing. A button label, a heading, an empty state, and an error message are different translation tasks even when some of their words overlap.

The amount of context sent to a *translator* is configurable:

| Mode | Context included |
| --- | --- |
| `none` | Source string only |
| `minimal` | Source string, component, and element |
| `rich` | Source string, component, element, and surrounding snippet |

The code becomes useful translation context without requiring developers to maintain a second layer of descriptions beside their messages.

## Batching and retries

Interactive saves and large translation backfills have different needs. A small edit should complete quickly; an initial locale import may involve hundreds or thousands of missing entries.

yapyak sends translation work through a worker pool. By default, it groups twenty-five messages per request and runs up to five batches concurrently. These values can be adjusted for the provider, model, and rate limits used by a project.

Results are written back in request order, even when batches finish in a different order. For larger runs, progress is reported as each batch completes:

```txt
fi · 478/1000 · ███████████░░░░░░░░░░░░░
```

Provider requests may fail for reasons that are safe to retry. Responses such as `408`, `429`, and `5xx` are retried with exponential backoff:

| Attempt | Delay before request |
| --- | --- |
| 1 | none |
| 2 | 250ms |
| 3 | 500ms |
| 4 | 1s |
| 5 | 2s |
| 6 | 4s |
| 7 and later | 8s |

The default `maxRetries` value is `2`, giving each request up to three attempts. Requests time out after thirty seconds and accept an abort signal, so interrupted work does not continue writing translations after it is no longer relevant.

Client and authentication errors such as `400`, `401`, `403`, and `404` are returned immediately. They indicate a request or configuration problem rather than a temporary provider failure.

## Keeping the save loop small

Automatic translation during development is intended for normal editing, not for silently processing an entire application after a large import or generated change.

By default, yapyak translates up to twenty new messages created by a single save. Larger changes still synchronize the locale files, but translation is left to an explicit CLI run.

| Change | Result |
| --- | --- |
| Save adds 1–20 new messages | Missing entries are translated immediately |
| Save adds more than 20 (large paste or generated change) | Entries are synchronized; translation is deferred to the CLI |
| New locale added against an existing backlog of messages | Entries are created; `yapyak translate <locale>` fills them |

Set the threshold to `0` to disable translation during saves while keeping CLI translation available.

This boundary is intentional. A save should remain a predictable development action. Large translation work is useful, but it should be visible and deliberate.

## Why translations are compiled into modules

Most i18n systems are organized around a catalog: a collection of every message known to the application, usually loaded per locale and sometimes divided into namespaces. That model works, but it gives translations a runtime shape that is separate from the UI that uses them.

Modern Vite applications already have a better unit of delivery: the module graph. Routes and features become chunks. Code that the user never reaches does not need to be downloaded on the initial path.

yapyak follows that graph. If a settings route contains thirty translated messages, its chunk carries those messages for the configured locales. A user who never opens settings does not download its translations merely because the application supports them elsewhere.

This property becomes more useful as an application grows. Adding routes increases the number of chunks; it does not turn every visited screen into a delivery vehicle for the application's full translation surface. The amount of translated text shipped for a screen remains tied to the UI that screen actually renders.

The same model also keeps locale switching synchronous for code that is already loaded. Once a component's chunk is present, its translated variants are present with it. Switching locale does not require that component to find or fetch another runtime dependency before it can render.

SSR follows the same rule. The server renders from the compiled variants already associated with the modules it executes, rather than depending on a separate catalog-loading phase.

## A compiler where the meaning already is

The important part of yapyak is not that it can call a translation provider during development. It is that localization begins at the call site.

```tsx
t('Save changes')
```

A developer can read that line without resolving a key elsewhere. TypeScript can infer parameters from the message being called. The compiler can validate message syntax while it still knows the file and expression that produced it. A *translator* can receive the component and surrounding code that explain what the words are for. A coding agent can change or move UI without having to discover an unrelated catalog structure first.

Then, once the source is valid and translations exist, Vite ships them in the same shape as the application itself: alongside the code that renders them.

That is the model yapyak is built around. The source string is written once, in its real context. Translation becomes part of the development loop, and the compiled result stays local to the interface the user can actually reach.
