---
title: HMR
order: 1
---

yapyak's runtime is wired into [Vite's HMR](https://vitejs.dev/guide/api-hmr). Code edits, model-written translations, and hand-edits to `locales/<locale>.json` all reach the running browser without a reload.

## Source-file save loop

The default path: you write a new `t()` call (or edit an existing one), save the file, and:

1. Vite picks up the file change and notifies the yapyak plugin.
2. The plugin runs your [framework processor](/guide/getting-started/installation) over the file, finds every `t()` call, and validates them.
3. yapyak updates your locale files: adds new stubs, notes removed strings, and follows [renames](/guide/translating/renames).
4. If a [translator](/guide/translating/overview) is configured, yapyak sends empty stubs to it and writes the results back to your locale files.
5. The compiled module is rewritten with the new `_pick()` lookups inline.
6. Vite hot-replaces the module. The component re-renders.

The whole loop takes milliseconds for the source-only steps and a few seconds for the translator step. Component state — open dialogs, controlled form inputs, scroll position — stays put because Vite swaps the module without re-mounting.

{% callout variant="info" %}
For `.astro` files, step 6 differs. Astro doesn't run yapyak's runtime in the browser, so the page reloads instead of doing a module swap. State doesn't survive — but it wouldn't on the server side either, so the effect matches normal Astro HMR.
{% /callout %}

## Locale file save loop

A model-returned translation and a hand-edit both write to `locales/<locale>.json`, and both follow this path:

1. Vite picks up the JSON change.
2. The yapyak plugin reads the new file and diffs it against the cached version.
3. Just the changed entries are sent to the browser over Vite's WebSocket.
4. The runtime in the browser updates them in memory.
5. Every component that calls `t()` for one of the changed strings re-renders.

This is the fast path. The source modules aren't recompiled, so component state survives. The whole loop is sub-second for typical edits.

Open `locales/sv.json` in your editor next to the running app, edit a translation, save — the change appears in the browser within the same render cycle. Useful for tuning copy outside the model path.

## Translator save loop

The same source-file save loop, but with the translator step taking real time. The user-facing experience:

1. You write a new `t('Some new string')`.
2. You save. The string renders in your source language immediately (no need to wait).
3. A second or two later, the model translates it, writes the result to `locales/sv.json`, and HMR updates the browser.

The split keeps the save loop short. The source string appears immediately; the translation arrives once the model returns.

Two settings affect this:

- [`autoTranslateThreshold`](/guide/getting-started/configuration#autotranslatethreshold). When a single save adds more new strings than this number (default 20), yapyak writes stubs but holds off on the translator. Run [`yapyak translate`](/reference/cli/translate) when you're ready.
- [`concurrency`](/guide/translating/providers#shared-options). Higher concurrency speeds up large translator runs but presses harder on your provider's rate limit.

## When HMR doesn't apply

- **Config file changes.** Editing `yapyak.config.ts` (or `vite.config.ts`) reloads the dev server. yapyak's plugin can't safely HMR its own configuration.
- **Locale-set changes.** Adding a new locale through [`yapyak add`](/reference/cli/add) regenerates `.yapyak/types.d.ts` and reloads the dev server so TypeScript picks up the new union.
- **Astro pages.** As noted above, `.astro` files reload rather than HMR.


## Debugging HMR

Check the browser console for messages prefixed `[yapyak]`. The plugin logs every accept and every rejection — usually enough to spot what's blocking the swap (a syntax error in `locales/sv.json`, a TypeScript error in the source, a stale `.yapyak/` cache).
