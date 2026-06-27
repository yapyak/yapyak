---
title: HMR
order: 1
---

yapyak's runtime is wired into [Vite's HMR](https://vitejs.dev/guide/api-hmr) so a save in your code, a model writing to a locale file, or a hand-edit to `locales/sv.json` all land in the running browser without a reload. This page covers the three paths and the moments where they behave differently from a plain code edit.

## Source-file save loop

The default path: you write a new `t()` call (or edit an existing one), save the file, and:

1. Vite picks up the file change and notifies the yapyak plugin.
2. The plugin runs your [framework processor](/guide/getting-started/installation) over the file, finds every `t()` call, and validates them.
3. Missing or changed entries are reconciled against your locale files. New stubs added, removed strings noted, [renames](/guide/translating/renames) followed.
4. If a [translator](/guide/translating/overview) is configured, empty stubs are sent to it. Results write back to locale files.
5. The compiled module is rewritten with the new `_pick()` lookups inline.
6. Vite hot-replaces the module. The component re-renders.

The whole loop takes milliseconds for the source-only steps and a few seconds for the translator step. Component state. Open dialogs, form inputs, scroll position. Stays put because Vite swaps the module without re-mounting.

{% callout variant="info" %}
For `.astro` files, step 6 differs. Astro doesn't run yapyak's runtime in the browser, so the page reloads instead of doing a module swap. State doesn't survive the reload. But it didn't survive on the server side anyway, so the effect is the same as a normal Astro HMR.
{% /callout %}

## Locale file save loop

When a model returns a new translation, yapyak writes it to your `locales/<locale>.json` file. Same thing happens when you hand-edit a translation. In both cases:

1. Vite picks up the JSON change.
2. The yapyak plugin reads the new file and diffs it against the cached version.
3. Just the changed entries are sent to the browser over Vite's WebSocket.
4. The runtime in the browser updates them in memory.
5. Every component that calls `t()` for one of the changed strings re-renders.

This is the fast path. The source modules aren't recompiled, so component state survives. The whole loop is sub-second for typical edits.

You can lean on this in practice: open `locales/sv.json` in your editor alongside the running app, edit a translation, and watch the change land in the browser before you've lifted your finger off `Cmd-S`. Useful for fine-tuning copy without round-tripping through a model.

## Translator save loop

The same source-file save loop, but with the translator step taking real time. The user-facing experience:

1. You write a new `t('Some new string')`.
2. You save. The string renders in your source language immediately (no need to wait).
3. A second or two later, the Swedish translation appears in the running browser as the model's response writes back to the locale file and HMR picks it up.

The split. Source visible immediately, translation arrives shortly. Keeps the dev loop snappy even when the translator is doing real work. You're not blocked on the model.

Two settings affect this:

- [`autoTranslateThreshold`](/guide/getting-started/configuration#autotranslatethreshold). When a single save adds more new strings than this number (default 20), yapyak writes stubs but holds off on the translator. Run [`yapyak translate`](/reference/cli/translate) when you're ready.
- [`concurrency`](/guide/translating/providers#shared-options). Higher concurrency speeds up large translator runs but presses harder on your provider's rate limit.

## When HMR doesn't apply

A few cases skip the hot path and trigger a full reload:

- **Config file changes.** Editing `yapyak.config.ts` (or `vite.config.ts`) reloads the dev server. yapyak's plugin can't safely HMR its own configuration.
- **Locale-set changes.** Adding a new locale through [`yapyak add`](/reference/cli/add) regenerates `.yapyak/types.d.ts` and reloads the dev server so TypeScript picks up the new union.
- **Astro pages.** As noted above, `.astro` files reload rather than HMR.

In every case, the trigger is something that has to take effect before yapyak can do any further work. Not something yapyak does to be conservative.

## What the runtime watches for

The runtime registers two HMR handlers:

- One for translation map updates (the locale file path)
- One for config changes (the yapyak.config.ts path)

If you're debugging "why isn't HMR working", check the browser console for messages prefixed `[yapyak]`. The plugin logs every accept and every rejection. Usually enough to spot what's blocking the swap (a syntax error in `locales/sv.json`, a TypeScript error in the source, a stale `.yapyak/` cache).
