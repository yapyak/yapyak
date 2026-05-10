# How it works

A high-level tour of what happens between `t('Save changes')` in your component and `Guardar cambios` rendering in the user's browser.

## The pipeline

```
[ component.tsx ]
   t('Save changes')
        │
        ▼
[ Vite plugin: extract ]
   collects every t() call → (file, line, column, source)
        │
        ▼
[ sync locale files ]
   diff against last extraction
   add new strings, prune removed, migrate renamed positions
        │
        ▼
[ auto-translate ]
   batch missing strings → AI provider → write to locales/{locale}.json
        │
        ▼
[ Vite plugin: transform ]
   rewrite each call site:
   t('Save changes')  →  __yapyak_pick({ en: '...', es: '...', ... })
        │
        ▼
[ runtime: pick ]
   reads current locale from store → returns variant
        │
        ▼
[ HMR ]
   pushes the new compiled module to the browser
```

Five subsystems collaborating: extract, sync, translate, transform, and the runtime.

## On every save

When a user saves a source file in dev, the plugin's `handleHotUpdate` hook runs:

1. **Re-extract.** The plugin parses the file and collects every `t()` call site. For each: `(file path, line, column, source string, optional fixed locale from t.in('xx'))`.
2. **Compare positions.** New extraction is compared against the previous one for that file. The plugin computes three sets:
   - **Added strings** (appeared at a position that didn't have one before)
   - **Removed strings** (disappeared from a position that had one)
   - **Renamed strings** (a string disappeared at line 23, column 12 *and* a new string appeared at line 23, column 12 — that's a rename, not a delete-and-add)
3. **Migrate locale files.** For each rename, the locale entries get the key swapped — translations preserved as placeholders. Removed strings get pruned. Added strings get empty stubs in every locale.
4. **Trigger auto-translation.** Stubs are batched and sent to the configured translator (Anthropic, OpenAI, custom). Results are written to `locales/{locale}.json`.
5. **HMR.** Vite's HMR engine pushes the updated JSON-backed compiled modules to the browser.

The user typed `t('Save changes')`, saved, and a second later sees `Guardar cambios` in the running app — without thinking about a single JSON file.

## The transform: from `t('...')` to inline lookup

When the plugin encounters a `t()` call in a `.ts`, `.tsx`, `.js`, `.jsx`, `.svelte`, or `.vue` file, it rewrites the call to a direct lookup with all locale variants inlined:

```ts
// You write:
{t('Save changes')}

// Plugin rewrites to:
__yapyak_pick({
  en: 'Save changes',
  es: 'Guardar cambios',
  fr: 'Enregistrer les modifications',
  de: 'Änderungen speichern',
})
```

The runtime helper `__yapyak_pick` is tiny:

```ts
function pick(variants, params, fixedLocale) {
  const locale = fixedLocale ?? getLocaleStore().get();
  const value = variants[locale] ?? variants[defaultLocale] ?? '';
  return params ? interpolate(value, params) : value;
}
```

Because the variants are inlined per call site, Vite and Rollup can tree-shake at module level: a route that doesn't import a string doesn't ship its translations. Bundle size scales with strings *used* per chunk, not total strings in the project.

## Locale resolution at runtime

The runtime locale lives in a store with three reading paths and one writing path:

- **Client read:** `getLocaleStore().get()` returns the current locale, optionally falling back to a persisted cookie or localStorage value, then to `defaultLocale`.
- **Server read:** the adapter (TanStack Start, SvelteKit, custom) wires `setRequestSource(() => ({ acceptLanguage, cookieHeader }))` at request boundary. `get()` resolves per-request via `AsyncLocalStorage`, so concurrent requests don't pollute each other.
- **Reactive read:** React's `useLocale` hook subscribes via `useSyncExternalStore`. Svelte exports a `locale` singleton backed by `$state`. Vue exports a `locale` singleton backed by `ref` + `computed`. Components re-render when locale changes.
- **Write:** `setLocale(next)` updates the in-memory store, persists to cookie or localStorage if configured, and notifies all subscribers.

Same `getLocale()` import on the server and the browser. No isomorphism dance.

## On `vite build`

Production builds run the same pipeline once during the SSR build phase:

1. Walk all source files matching the source pattern
2. Extract every `t()` call across the project
3. Reconcile with locale files on disk
4. Auto-translate any missing strings
5. Bake locale variants into compiled call sites
6. Vite/Rollup tree-shake per chunk

The translator runs at build time only — the production runtime makes zero AI calls. Translations are static data baked into the bundle.

## On `yapyak <command>` from the CLI

The CLI shares the same extract/sync/translate machinery as the Vite plugin. `yapyak add fr` walks your source, extracts every `t()` call, creates `locales/fr.json`, batches all strings to your translator, and writes the result. `yapyak translate` fills missing translations across existing locales. `yapyak status` reports coverage. None of these commands require Vite to be running — they're independent entry points to the same library code.

## What stays out of the picture

- **No build step you have to run.** `vite dev` covers it. CI runs `npx yapyak check` to fail on missing translations.
- **No translation portal.** Locale files are JSON in your repo, version-controlled, reviewable as code.
- **No runtime AI call.** The AI runs at extract/translate time only. Production has no dependency on a model provider.
- **No central message registry.** Each call site is keyed by `(file path, source string)`. Move the file → translations follow.

## Where to read next

- [Translations / Auto-translation](/guide/translations/auto-translation) — the AI loop in detail
- [Translations / Position-aware renames](/guide/translations/position-aware-renames) — the rename mechanism, deep
- [Adapters](/guide/adapters/) — how SSR locale resolution works per framework
