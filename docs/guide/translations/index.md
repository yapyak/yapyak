# Translations

The string is the lookup. `t('Save changes')` finds the translation by exact source match — there is no key registry, no naming convention, no central JSON to keep in sync.

## The `t` function

```ts
import { t } from 'yapyak';

t('Save changes')                            // 'Guardar cambios' (es)
t('Hello {name}', { name: 'Joakim' })        // 'Hola Joakim'
```

Same import in React, Svelte, Vue, plain JavaScript, server functions, CLI scripts. Inline in templates too:

::: code-group

```tsx [React]
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

```svelte [Svelte]
<script lang="ts">
  import { t } from 'yapyak';
</script>

<button>{t('Save changes')}</button>
```

```vue [Vue]
<script setup lang="ts">
import { t } from 'yapyak';
</script>

<template>
  <button>{{ t('Save changes') }}</button>
</template>
```

:::

The plugin rewrites every call site at build time into a direct lookup with all locale variants inlined. No runtime parsing, no key resolution layer, no JSON loading.

## Parameters

Pass a `params` object as the second argument. Placeholders use `{name}` syntax and are substituted at runtime.

```tsx
t('Hello {name}', { name: 'Joakim' })
// 'Hola Joakim'

t('Saved {count} files', { count: 3 })
// 'Saved 3 files'
```

The current `t` signature is `(source: string, params?: Record<string, unknown>) => string`. Param presence and shape are **not** type-checked against the source string at compile time. If you reference a placeholder that isn't in `params`, the substitution returns an empty string at runtime.

## Plurals and selects

`t()` runs a subset of ICU MessageFormat at runtime:

- **`{count, plural, ...}`** — cardinal plurals. All CLDR categories supported (`zero`, `one`, `two`, `few`, `many`, `other`), plus `=N` exact-match branches. `#` is replaced with the count.
- **`{count, selectordinal, ...}`** — ordinal plurals (1st, 2nd, 3rd, …). Same category set.
- **`{name, select, ...}`** — named branches plus `other` fallback.
- Recursive interpolation — placeholders inside branches expand using the same `params` object.

```tsx
t('You have {count, plural, =0 {nothing} one {# item} other {# items}}', {
  count: 0,
})
// 'You have nothing'

t('You have {count, plural, one {# item} other {# items}}', { count: 3 })
// 'You have 3 items'

t('{name, select, joakim {Hej} other {Hello}} {greeting}', {
  name: 'joakim',
  greeting: 'world',
})
// 'Hej world'
```

Plural category is resolved per-locale via `Intl.PluralRules`. Russian `{count, plural, one {штука} few {штуки} many {штук}}` picks `few` for 2–4 and `many` for 5+ as the language requires.

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

Two files using the same source string can have *different* translations. Each `t()` call is keyed by `(file path, source string)`, so the same source in two contexts produces two independent entries.

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
2. **Reconcile** with `locales/*.json` — new strings get empty stubs, removed strings get pruned, renamed strings get migrated (see below)
3. **Translate** any new or stale entries via your configured translator

HMR pushes the new compiled module. The next render reads the new value.

## How renames work

Edit `t('Save')` to `t('Save changes')` and yapyak knows it's the same call site — it's a rename, not a delete-and-add.

```diff
- t('Save')
+ t('Save changes')
```

The plugin compares the **position** of every `t()` call between saves. String gone at line 23, column 12, new one at the exact same spot is a rename. Locale files get the key swapped:

```diff
// locales/es.json
- "Save": "Guardar"
+ "Save changes": "..."
```

Position matching is exact. No similarity heuristics, no false positives — "Save" and "Cave" never get confused even though they're 75% similar.

What lands in the value depends on whether a translator is configured:

| Configuration                                | Default value after rename | Why |
| -------------------------------------------- | -------------------------- | --- |
| `translator` set (`preserveTranslationsOnRename: false`) | empty stub, AI re-translates | The source changed; AI fills in the right new translation |
| no `translator` (`preserveTranslationsOnRename: true`) | old translation kept       | No AI to retranslate; preserving avoids destroying hand work |

Override explicitly if you need the opposite — e.g. with AI configured but a strict policy of never overwriting hand edits, set `preserveTranslationsOnRename: true`. Or move the term into [`glossary`](/guide/translators/anthropic#glossary-example) for permanent locking.

For more on the no-translator workflow, see [Manual translation](/guide/translations/manual-translation). For the AI loop, see [Auto-translation](/guide/translations/auto-translation).

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
