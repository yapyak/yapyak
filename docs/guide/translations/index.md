# Translations

The string is the lookup. `t('Save changes')` finds the translation by exact source match — there is no key registry, no naming convention, no central JSON to keep in sync.

## The `t` function

```tsx
import { t } from 'yapyak';

t('Save changes')                            // 'Guardar cambios' (es)
t('Hello {name}', { name: 'Joakim' })        // 'Hola Joakim'
```

`t` is the same import everywhere — React, Svelte, Vue, plain JavaScript, server functions, CLI scripts. The framework-specific piece is `useLocale`, not `t`.

The plugin rewrites every call site at build time into a direct lookup with all locale variants inlined. There is no runtime parsing, no key resolution layer, no JSON loading.

## Parameters

Parameters are inferred from the source string at compile time.

```tsx
t('Hello {name}', { name: 'Joakim' })   // ✓
t('Hello {name}')                       // ✗ TS error: missing { name }
t('Hello')                              // ✓ no params
t('Hello', { name: 'Joakim' })          // ✗ TS error: no params expected
```

You can't pass the wrong shape. TypeScript reads the literal and knows what it asks for.

## ICU plurals and selects

Standard ICU MessageFormat. Plurals, selects, named placeholders, exact matches.

```tsx
t('You have {count, plural, one {# item} other {# items}}', { count: 3 })
// 'You have 3 items'

t('{name, select, joakim {Hej} other {Hello}} {greeting}', {
  name: 'joakim',
  greeting: 'world',
})
// 'Hej world'

t('You have {count, plural, =0 {nothing} one {# item} other {# items}}', {
  count: 0,
})
// 'You have nothing'
```

The `{count, plural, ...}` and `{name, select, ...}` constructs are recognized by the type system: `count` is required as `number`, `name` as `string`. You don't have to register types separately.

## Forced locale: `t.in()`

Translations normally follow the active locale (per-request on the server, per-client on the browser). Sometimes you need to render in a *specific* locale regardless — most commonly for emails, multi-locale digests, or generating PDFs in a user's preferred language inside a different request context.

```ts
t.in('es')('Welcome back')
// 'Bienvenido de nuevo'

t.in('fr')('Hello {name}', { name: 'Marie' })
// 'Bonjour Marie'
```

`t.in(locale)` returns a function with the same signature as `t`, but locked to the given locale. Same compile-time rewrite — the variant for the fixed locale is selected directly from the inlined variants object.

::: tip
Use `t.in()` for one-off forced renderings. For an entire request that should run in a non-default locale (e.g. a webhook handler), set the locale in the request context instead — see [Adapters](/guide/adapters/).
:::

## Per-file scoping

Two files using the same English string can have *different* translations. Each `t()` call is keyed by `(file path, source string)`, so the same English in two contexts produces two independent entries.

```tsx
// src/components/employee-form.tsx
t('Save')   // becomes "Guardar" in es

// src/components/contract-actions-bar.tsx
t('Save')   // becomes "Conservar" in es — preserved on disk
```

```json
// locales/es.json
{
  "src/components/employee-form.tsx": { "Save": "Guardar" },
  "src/components/contract-actions-bar.tsx": { "Save": "Conservar" }
}
```

The AI gets the file path, the component name, and the enclosing JSX or template element as context, so it can disambiguate without you ever annotating. `t('Save')` inside a `<button>` translates differently from `t('Save')` inside an `<h1>`.

::: info
If two `t()` calls in the same file use the same source string, they share one entry. Per-file scoping disambiguates *across* files, not within them.
:::

## What happens on save

When you write a new `t()` call and save the file, the plugin runs three steps in sequence:

1. **Extract** every `t()` call site from the file
2. **Reconcile** with `locales/*.json` — new strings get empty stubs, removed strings get pruned, [renamed strings get migrated](/guide/translations/position-aware-renames)
3. **Translate** any new or stale entries via your configured translator

HMR pushes the new compiled module. The next render reads the new value.

For the deeper mechanics, see:

- [Auto-translation](/guide/translations/auto-translation) — the AI loop, batching, voice, force re-translate
- [Position-aware renames](/guide/translations/position-aware-renames) — how edits preserve existing translations

## Constraints

`t()` requires its first argument to be a **string literal**:

```tsx
t('Save changes')                       // ✓
t(`Save changes`)                       // ✓ no-substitution template literal
t(`Hello ${name}`)                      // ✗ template interpolation — extraction fails
const msg = condition ? 'Save' : 'Cancel';
t(msg)                                  // ✗ dynamic argument — extraction fails
```

The plugin extracts at build time. A non-literal first argument can't be statically analyzed and the build will throw with the file location. The fix is to surface both branches:

```tsx
{condition ? t('Save') : t('Cancel')}   // ✓ both extractable
```

This is the same constraint Lingui has for its `t` macro and Paraglide for its compiled functions. In practice it almost never bites — UI strings are literals.
