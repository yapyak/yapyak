---
order: 2
---

# How it works

The mental model in one paragraph: at build time, the Vite plugin rewrites every `t()` call to inject a file ID. Translations live in JSON files keyed by that file ID. At runtime, `t()` is a lookup against compiled JS functions that get tree-shaken per locale. SSR reads the request cookie via your framework's request-scoped headers; the client reads `document.cookie`. There is no runtime parser, no abstract key registry, no provider plumbing.

That's the whole library. The rest is the details.

## Step by step: what happens to `t('Hello')`

### 1. Build time — the plugin transforms your file

You write:

```tsx
<h1>{t('Hello')}</h1>
```

The plugin's `enforce: 'pre'` transform runs before anything else sees the file. It finds the `t(` call and rewrites it:

```tsx
<h1>{t('Hello', undefined, 'src/app.tsx')}</h1>
```

The third argument is the **fileId** — yapyak's lookup key. Same source string in two different files gets two different translations, no collisions.

The plugin also records the call's position (line, column) in `node_modules/.cache/yapyak/positions.json`. This is what powers position-aware rename detection.

### 2. First save — auto-translate fills the gap

If `'Hello'` is a string yapyak hasn't seen before:

1. Plugin reads `locales/en.json` (your default locale). `'Hello'` is missing — it adds `"Hello": "Hello"`.
2. Plugin reads `locales/sv.json`. `'Hello'` is missing — it calls your configured AI (Anthropic, OpenAI, or your own function) and writes `"Hello": "Hej"`.
3. Vite's HMR fires. Your browser reloads with the translation already in place.

If the position was previously occupied by *a different* source string, yapyak treats it as a rename and copies the old translation instead of calling the AI. Cheap, correct, no human work lost.

### 3. Build time — locales compile to functions

`sv.json` looks like this:

```json
{
  "src/app.tsx": {
    "Hello": "Hej"
  }
}
```

Yapyak's compiler turns it into a JavaScript module:

```js
export default {
  "src/app.tsx": {
    "Hello": () => "Hej"
  }
};
```

ICU plurals, selects, and placeholders compile to real JavaScript with `Intl.PluralRules` baked in. There is no runtime ICU parser. Each locale is its own chunk, lazy-loaded.

### 4. Runtime — the lookup

When the page renders, `t('Hello', undefined, 'src/app.tsx')` does:

```js
messages[currentLocale]['src/app.tsx']['Hello']()
// → "Hej"
```

That's it. A three-level dictionary lookup, then call the function. No parsing, no fallback chain at runtime, no async loading mid-render.

### 5. SSR — the locale comes from the request

On the server:

- Request arrives with `Cookie: locale=sv` header.
- `getLocale()` calls `getRequestSource()`, which is wired by your framework adapter (`tanstackStart()` or `sveltekit()`).
- The adapter pulls headers out of your framework's request-scoped AsyncLocalStorage.
- Cookie parsed, locale resolved to `'sv'`.
- Components render, `t()` looks up Swedish translations.
- HTML ships with `<html lang="sv">` and "Hej" already in place.

On the client, after hydration:

- `getLocale()` reads `document.cookie`.
- Same value, same lookup, same output.
- No hydration mismatch — the cookie is the source of truth on both sides.

### 6. Switching locales

User clicks a button:

```tsx
setLocale('en');
```

1. `document.cookie` is written.
2. Runtime updates its internal `clientLocale` to `'en'`.
3. Notifies all subscribed components (via React's `useSyncExternalStore`, Vue's reactive ref, Svelte's `$state`).
4. Components re-render. `t()` calls re-evaluate with the new locale.
5. UI is now in English.

No reload. No async wait. No request to the server.

## The mental model in a diagram

```
Source code:        t('Hello')
                         ↓ (Vite plugin transform)
Transformed:        t('Hello', undefined, 'src/app.tsx')
                         ↓ (auto-translate on save)
locales/sv.json:    { "src/app.tsx": { "Hello": "Hej" } }
                         ↓ (Vite compile)
locale-sv.js:       { "src/app.tsx": { "Hello": () => "Hej" } }
                         ↓ (runtime lookup)
t() returns:        "Hej"
```

Five transitions, all of them either build-time or zero-runtime-cost. The runtime cost of `t()` is one object lookup and one function call. That's why yapyak doesn't ship an ICU parser — it doesn't need one.

## What yapyak does not do

A few things explicitly absent from the design, by choice:

- **No abstract message IDs.** The English text is the key. If you need different translations for the same source string, scope by file (automatic) or by adding context to the source itself.
- **No runtime parser.** Translation strings are functions, not parsed at runtime.
- **No async loaders.** All locales for the configured set bundle in upfront. If you need lazy loading of locales for reduced initial bundle, that's a feature we'd add later — but most apps with 2-5 locales don't need it.
- **No global config object passed to every call.** `t()` is a plain function. The framework adapter handles reactivity.

The library is small because the design is small. Most of the complexity that other i18n libraries carry around — registries, parsers, runtime config, plugin chains — yapyak pushes to build time or eliminates entirely.
