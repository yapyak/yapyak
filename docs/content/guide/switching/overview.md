---
title: Overview
order: 1
---

A locale in yapyak is the BCP 47 tag of one of the JSON files in your `localesDir`. `'sv'` for `locales/sv.json`, `'en-GB'` for `locales/en-GB.json`.

yapyak generates the [`Locale`](/reference/yapyak/Locale) type from the files it finds on disk. The type refreshes on every [`yapyak add`](/reference/cli/add).

## The active locale

At any moment, one of your locales is the **active locale**. Reading and writing it is the runtime API.

[`t()`](/reference/yapyak/t) reads the active locale and returns the matching translation:

```ts
t('Save changes');
```

The [`format`](/guide/formatting/overview) namespace reads it too. `format.number`, `format.dateTime`, `format.list`, and `format.relativeTime` all use the active locale on every call.

When the active locale changes, every component that read it re-renders.

## Reading it

```ts
import { getLocale } from 'yapyak';

getLocale();
// output: 'sv' | 'en' | ...
```

[`getLocale()`](/reference/yapyak/getLocale) returns the current locale. The return type is the union of every locale code you've added.

In components, prefer the framework binding. It subscribes the component to changes so re-renders happen automatically. See [Switch](/guide/switching/switch) for the per-framework shape.

## Where the active locale comes from

yapyak resolves the active locale in this order, taking the first that yields a value:

1. **A persisted choice.** A cookie, URL parameter, or `localStorage` entry written by an earlier `setLocale()` call. Configured via [`persistence`](/guide/getting-started/configuration#persistence).
2. **A detected locale**, if [`detectUserLocale`](/guide/getting-started/configuration#detectuserlocale) is enabled. yapyak reads the `Accept-Language` header on the server (under the [SSR adapter](/guide/getting-started/installation)) or `navigator.languages` in the browser, and matches it against your locales.
3. **The `defaultLocale`.** Your source language, the catch-all. Set via [`defaultLocale`](/guide/getting-started/configuration#defaultlocale) (defaults to `'en'`).

For fixed-locale builds, the active locale is hard-coded at compile time and there's nothing to resolve at runtime. See [Fixed-locale builds](/guide/advanced/fixed-locale).

## Changing the active locale

```ts
import { setLocale } from 'yapyak';

setLocale('sv');
```

[`setLocale()`](/reference/yapyak/setLocale) updates the runtime store and notifies every subscriber. If you've configured persistence, the new choice is written back so it survives a reload.
