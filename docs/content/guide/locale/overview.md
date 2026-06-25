---
title: Overview
order: 1
---

A locale in yapyak is the BCP 47 name of one of the JSON files in your `localesDir`: `'sv'` for `locales/sv.json`, `'en-GB'` for `locales/en-GB.json`. The `Locale` type is generated from the files yapyak finds on disk and refreshed on every [`yapyak add`](/guide/cli/add).

At any moment, one of those locales is the **active locale.** Calling `t()` reads it and returns the matching translation; `format.number`, `format.dateTime`, and the rest of the [`format`](/guide/formatting/overview) namespace do the same. When the active locale changes, every component that read it re-renders.

## Reading the active locale

```ts
import { getLocale } from 'yapyak';

getLocale();
// output: 'sv' | 'en' | ...
```

The return type is the union of every locale code you've added.

In components, prefer the framework binding. It subscribes the component to changes so re-renders happen automatically. See [Switch](/guide/locale/switch) for the per-framework shape.

## Where the active locale comes from

yapyak resolves the active locale in this order, taking the first that yields a value:

1. **A persisted choice.** A cookie, URL parameter, or `localStorage` entry written by an earlier `setLocale()` call. Configured via [`persistence`](/guide/getting-started/configuration#persistence).
2. **Detected from the environment** when [`detectUserLocale`](/guide/getting-started/configuration#detectuserlocale) is enabled. The `Accept-Language` request header on the server (under the [SSR adapter](/guide/adapters/overview)) or `navigator.languages` in the browser (at runtime initialization). The detected value is matched against your configured locales.
3. **The `defaultLocale`.** Your source language, the catch-all. Set via [`defaultLocale`](/guide/getting-started/configuration#defaultlocale) (defaults to `'en'`).

For fixed-locale builds, the active locale is hard-coded at compile time and there's nothing to resolve at runtime. See [Fixed-locale builds](/guide/getting-started/configuration#fixed-locale-builds).

## Changing the active locale

```ts
import { setLocale } from 'yapyak';

setLocale('sv');
```

`setLocale` updates the runtime store and notifies every subscriber. If you've configured persistence, the new choice is written back so it survives a reload.
