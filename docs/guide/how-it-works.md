---
order: 2
---

# How it works

The mental model in one paragraph: at build time, the Vite plugin rewrites every `t('source')` call to a direct reference to a tree-shakable function in a virtual `yapyak/messages` module. Each unique `(file, source)` pair gets its own compiled function with all locales inlined. Translations live in JSON files keyed by file ID. SSR reads the request cookie via your framework's request-scoped headers; the client reads `document.cookie`. There is no runtime parser, no abstract key registry, no provider plumbing.

That's the whole library. The rest is the details.

## Step by step: what happens to `t('Hello')`

### 1. Build time — the plugin transforms your file

You write:

```tsx
<h1>{t('Hello')}</h1>
```

The plugin's `enforce: 'pre'` transform finds the `t(` call, parses the source-string literal, computes a stable hash from `(fileId, source)`, and rewrites the call:

```tsx
import { _m_a3f8b2c1d4e5 } from 'yapyak/messages';

<h1>{_m_a3f8b2c1d4e5()}</h1>
```

The hash is deterministic: same source in same file always gets the same hash. Two files with identical English get *different* hashes — that's component-discriminated translations, automatic, free.

The plugin records the call's position (line, column) in `node_modules/.cache/yapyak/positions.json`. This powers position-aware rename detection.

If the source argument isn't a string literal — e.g. `t(someVariable)` or `` t(`Hi ${name}`) `` — the build fails with a clear error. Tree-shaking only works when sources are statically resolvable.

### 2. First save — auto-translate fills the gap

If `'Hello'` is a string yapyak hasn't seen before:

1. Plugin reads `locales/en.json` (your default locale). `'Hello'` is missing — it adds `"Hello": "Hello"`.
2. Plugin reads `locales/sv.json`. `'Hello'` is missing — it checks every other file in the JSON for the same source string. If found, the existing translation is reused (cross-file rename-stable). If not, it calls your configured AI with the source *and* call-site context (component name, surrounding code) and writes `"Hello": "Hej"`.
3. The virtual `yapyak/messages` module is invalidated. Vite's HMR fires. Your browser reloads with the translation already in place.

If the position was previously occupied by *a different* source string in the same file, yapyak treats it as a rename and copies the old translation forward. Cheap, correct, no human work lost.

### 3. The virtual messages module

When something imports from `yapyak/messages`, the plugin generates the module from the registry of every `(fileId, source)` pair the transform has seen, plus the JSON translation files:

```js
import { getLocale } from 'yapyak';

export const _m_a3f8b2c1d4e5 = (p) => ({
  en: () => 'Hello',
  sv: () => 'Hej',
})[getLocale()]();

export const _m_b7d9c1f4e3a2 = (p) => ({
  en: () => 'Cancel',
  sv: () => 'Avbryt',
})[getLocale()]();

// ... one export per unique message
```

ICU plurals, selects, and placeholders compile to real JavaScript with `Intl.PluralRules` baked in. There is no runtime ICU parser.

### 4. Tree-shaking

This is where yapyak gets small. Each message is a top-level export. Vite/Rollup tree-shake at module level: route `/checkout` only references the messages it actually uses, so only those messages' bodies end up in the route's chunk.

App with 1000 messages × 5 locales, route `/checkout` uses 20 messages: the route loads 20 inlined functions, not 5000.

Same architectural advantage as Paraglide's tree-shaking — but you keep writing source-string-as-key.

### 5. Runtime — the call

When the page renders, `_m_a3f8b2c1d4e5()` does:

```js
({ en: () => 'Hello', sv: () => 'Hej' })[getLocale()]()
// → "Hej"
```

Two object lookups and a function call. No registry, no fallback chain, no async loading mid-render.

### 6. SSR — the locale comes from the request

On the server:

- Request arrives with `Cookie: locale=sv` header.
- `getLocale()` calls `getRequestSource()`, which is wired by your framework adapter (`adapter: 'tanstackStart'` or `adapter: 'sveltekit'` in plugin config).
- The adapter pulls headers out of your framework's request-scoped AsyncLocalStorage.
- Cookie parsed, locale resolved to `'sv'`.
- Components render, message functions look up Swedish translations.
- HTML ships with `<html lang="sv">` and "Hej" already in place.

On the client, after hydration:

- `getLocale()` reads `document.cookie`.
- Same value, same lookup, same output.
- No hydration mismatch — the cookie is the source of truth on both sides.

### 7. Switching locales

User clicks a button:

```tsx
setLocale('en');
```

1. `document.cookie` is written.
2. Runtime updates its internal locale state.
3. Notifies all subscribed components (via React's `useSyncExternalStore`, Vue's reactive ref, Svelte's `$state`).
4. Components re-render. Each message function re-evaluates `getLocale()` and returns the new locale's string.
5. UI is now in English.

No reload. No async wait. No request to the server.

## The mental model in a diagram

```
Source code:        t('Hello')
                         ↓ (Vite plugin transform — parse + hash)
Transformed:        _m_a3f8b2c1d4e5()   (+ injected import)
                         ↓ (auto-translate on save → cross-file reuse → AI fallback with context)
locales/sv.json:    { "src/app.tsx": { "Hello": "Hej" } }
                         ↓ (virtual messages module generated)
yapyak/messages:    export const _m_a3f8b2c1d4e5 = (p) => ({en, sv})[getLocale()]();
                         ↓ (Rollup tree-shakes per route chunk)
runtime:            _m_a3f8b2c1d4e5()   →   "Hej"
```

Most of these transitions are build-time or zero-runtime-cost. The runtime cost of a `t()` call is one object lookup and one function call. That's why yapyak doesn't ship an ICU parser — it doesn't need one.

## What yapyak does not do

A few things explicitly absent from the design, by choice:

- **No abstract message IDs.** The English text is the key. If you need different translations for the same source string in the same file, scope by file (automatic) or split the call site into a different file.
- **No runtime parser.** Translation strings are functions, not parsed at runtime.
- **No dynamic source strings.** `t(myVar)` is a build error. Sources must be static literals so they can be hashed and tree-shaken.
- **No global config object passed to every call.** `t()` becomes a direct function reference after transform. Reactivity is the framework adapter's job.

The library is small because the design is small. Most of the complexity that other i18n libraries carry — registries, parsers, runtime config, plugin chains — yapyak pushes to build time or eliminates entirely.
