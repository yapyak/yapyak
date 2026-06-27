---
title: Overview
order: 1
---

A translation in yapyak is the value a `t()` call resolves to in a non-default locale. Every call adds an empty stub to your locale files until something writes a value in.

```json [locales/sv.json]
{
  "src/components/empty-cart.tsx": {
    "Your cart is empty": ""
  }
}
```

## Three ways to fill

Three sources can write a translation:

- **You.** Open `locales/sv.json` and type. Vite HMR refreshes the running app on save.
- **Your coding agent.** Same path: the agent edits the JSON file and saves.
- **A translator.** A model translator configured in `yapyak.config.ts` fills empty stubs as soon as they appear, batched into requests that go straight from your machine to the provider.

The three paths coexist. The translator leaves hand-written translations alone, and you can rewrite a translator-written value by hand at any time. The locale files are the single source of truth.

## When the translator runs

With a translator configured, yapyak fills new stubs on save and during `yapyak translate` runs in CI. See [Loop](/guide/translating/loop) for the dev-time path and [Coverage](/guide/translating/coverage) for the CLI path.

## When you don't need a translator

The translator is optional. Without one, new stubs stay empty until you write a value:

- You (or a teammate) fill them in by hand.
- You paste in translations from a professional service.
- [`yapyak status`](/guide/translating/coverage) and [`yapyak check`](/guide/translating/coverage) still track coverage and gate CI.

Common for teams that hand-write every translation, or for early-stage projects where one model isn't ready to make tone decisions yet.

## Picking a translator

yapyak ships translators for four providers and accepts a [custom translator](/guide/advanced/custom-translator) for anything else. See [Providers](/guide/translating/providers).
