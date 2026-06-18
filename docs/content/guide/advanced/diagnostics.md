---
title: Diagnostics
order: 3
---

yapyak's compiler runs every save and surfaces any problem it finds as a `YAP-` diagnostic — a compile-time warning or error you'll see in your editor and in your terminal. This page is the reference: every code, what it means, and how to fix it.

## How diagnostics show up

Three places:

- **Your editor.** TypeScript surfaces them inline through the language service, with the YAP code, the message, and a hint.
- **Your terminal.** Vite logs each diagnostic during dev. The CLI ([`yapyak check`](/guide/cli/check)) prints them with full file/line context.
- **CI output.** The `yapyak check` step fails with a non-zero exit code if any diagnostic with `severity: error` fires.

Each diagnostic has a code, a one-line message, and (for most) a hint suggesting the fix. Codes are stable across versions — once `YAP0017` means "context not literal", that's what it will keep meaning.

## Parser — source argument shape

Things the compiler caught while looking at the `t()` call itself.

### `YAP0001` — No source

```ts
t();              // missing source

t.as('action');   // missing source
```

Pass the source string as the first argument (second for `t.as()`).

### `YAP0002` — Dynamic template literal

```ts
t(`Hi ${name}`);  // no

t('Hi {name}', { name });  // yes
```

The source has to be a static string literal so the compiler can extract it. Use a placeholder instead.

### `YAP0003` — Empty source

```ts
t('');  // no
```

Empty strings can't be translation keys. If you genuinely want an empty render, return `''` directly.

### `YAP0004` — Missing parameter

```ts
t('Hi {name}', {});            // missing 'name'

t('Hi {name}', { user: 'A' }); // missing 'name', has extra 'user'
```

Add the key to the params object.

### `YAP0005` — Extra parameter

```ts
t('Hi', { name: 'A' });  // 'name' isn't used
```

Either add `{name}` to the source or remove it from the parameters.

### `YAP0006` — Dynamic parameters

```ts
const params = { name: 'A' };
t('Hi {name}', params);  // can't be statically verified
```

Pass the params object inline so the compiler can read it.

## Placeholder — ICU validation

Things the compiler caught inside an ICU placeholder (`{name}`, `{count, plural, ...}`, etc.).

### `YAP0007` — Malformed ICU

Mismatched braces, empty branches, broken syntax. The detail message tells you what's off.

### `YAP0008` — Missing `other` branch

```ts
t('{count, plural, one {one}}', { count });  // missing 'other'
```

`plural`, `selectordinal`, and `select` all require an `other` fallback.

### `YAP0009` — Unsupported feature

ICU has features yapyak doesn't support — plural offsets, custom number skeletons, apostrophe escaping in some forms. Pick a supported alternative or format the value before passing it in.

### `YAP0010` — Kind mismatch

```ts
// source
t('{count, plural, one {one} other {other}}');
// translation
{
  "{count, plural, one {one} other {other}}": "{count, select, ...}",
}
```

A translation can't change a placeholder's format from `plural` to `select`. The structure has to match.

### `YAP0011` — Missing in translation

A placeholder in the source isn't in the translation. The compiler caught it before runtime.

### `YAP0012` — Missing in source

A placeholder in the translation isn't in the source. Same idea, other direction — usually a hand-edit slip.

### `YAP0038` — Missing branch in target

```ts
// source
'{count, plural, one {1} few {few} other {many}}'
// sv translation missing the 'few' branch
```

Some translations need branches the source doesn't have (Slavic languages, Arabic) and vice versa. The compiler flags it when the target is missing a category the source declares.

## Catalog — locale file integrity

Things the compiler caught reading or writing your locale files.

### `YAP0013` — Invalid shape

A locale entry isn't shaped like `{ "source": "translation" }` or `{ "source": { "context": "translation" } }`. Usually a hand-edit gone wrong.

### `YAP0014` — Unsafe path

A file-path key contains `..`, a Windows-style separator, or an absolute path. Locale entries must use forward-slash relative paths.

### `YAP0015` — Not NFC normalized

A source string isn't in Unicode NFC form. yapyak normalizes during extraction; this fires if you've hand-edited a key into a non-canonical form.

### `YAP0016` — Invalid JSON

A locale file isn't parseable JSON. The detail message includes the parser error.

### `YAP0031` — Corrupt locale file

A locale file is structurally damaged in a way `YAP0016` doesn't cover — usually a partial write or filesystem issue.

### `YAP0032` — Corrupt orphan cache

The `.yapyak/` cache is damaged. Delete the directory; yapyak rebuilds it from your locale files on the next save.

### `YAP0039` — Migration failed

Migrating a locale file from an older yapyak format to a newer one failed for one locale. yapyak skipped it and continued with the others — you can re-run after investigating the message.

## Context — `t.as()` and `t.in()`

### `YAP0017` — Context not literal

```ts
t.as(someVariable, 'Open');  // no

t.as('action', 'Open');      // yes
```

The first argument to `t.as()` has to be a static string literal.

### `YAP0018` — Mixed usage

```ts
// in the same file:
t('Open');
t.as('action', 'Open');
```

A source string can't use both `t()` and `t.as()` in one file. Pick one form per source.

### `YAP0019` — Unused context

```ts
t.as('only', 'Open');  // no other context for 'Open' anywhere
```

The whole point of `t.as()` is to distinguish from another context. If there's only one, drop the `.as()`.

### `YAP0020` — Captured chain

```ts
const tr = t.as('action');  // no
tr('Open');                 // no
```

The chain forms (`t.as(...)`, `t.in(...)`) have to be used inline — the compiler can't extract a source through a stored chain.

## Runtime — wiring

Things yapyak noticed while running, usually pointing at a setup issue.

### `YAP0021` — Runtime not initialized

The runtime is loaded but the build-tool plugin isn't. Add `yapyak()` to your `vite.config.ts` plugins.

### `YAP0022` — Server-side leak risk

`getLocale()` fell back to the shared module-global locale during SSR. Install the matching [SSR adapter](/guide/adapters/overview) so each request binds its own locale.

### `YAP0027` — Locale listener threw

A locale-change subscriber threw an exception. yapyak continued with the remaining subscribers; check the message for the failing one.

### `YAP0030` — Forced locale invalid

`t.in('xx', 'source')` was called with a tag that isn't a valid BCP 47 locale. yapyak fell back to your `defaultLocale`.

### `YAP0040` — Tracker threw

A reactivity tracker (auto-registered by framework bindings) threw during a re-render. yapyak continued with the remaining trackers.

## Persistence

Things related to [persistence strategies](/guide/locale/persistence).

### `YAP0023` — Cookie writer missing

`setLocale()` was called on the server outside a `withResponse` scope. The cookie wasn't set. Install the matching [SSR adapter](/guide/adapters/overview).

### `YAP0024` — Local-storage SSR skipped

`setLocale()` was called on the server with `persistence: 'local-storage'`. Local storage is browser-only — use `cookie` for SSR.

### `YAP0025` — Local-storage write failed

`setLocale()` couldn't write to `localStorage` (quota exceeded, Safari private mode, storage disabled). The in-memory locale was updated but won't survive a reload.

### `YAP0026` — URL persistence skipped

`setLocale()` was called with `persistence: 'url'`. The URL is the source of truth — drive locale switches through router navigation, not `setLocale()`.

### `YAP0028` — Locale-set ignored

`setLocale('xx')` was called with a value that isn't one of your locales. The call was ignored.

### `YAP0029` — SSR leak risk on `setLocale()`

`setLocale()` was called on the server in a way that would leak across concurrent requests. Configure `cookie` or `url` persistence.

## Translator

### `YAP0033` — Chunk failed

A batch chunk failed after retries during a translator run. yapyak kept the other chunks and returned partial results. Re-run [`yapyak translate`](/guide/cli/translate) to retry just the empty stubs.

### `YAP0034` — Entry shape invalid

A custom translator returned something other than an object keyed by target locales for one entry. That entry was dropped and the translations are empty. Fix the custom translator's return shape.

## Formatting

### `YAP0035` — Unsupported currency

`format.number(..., { currency: 'XXX' })` with a currency code your `Intl` runtime doesn't know. yapyak rendered the value as `<value> XXX` instead of failing.

### `YAP0036` — Unsupported unit

Same idea for `format.number(..., { unit: '...' })`.

### `YAP0037` — Unsupported time zone

`format.dateTime(..., { timeZone: '...' })` with a zone your `Intl` doesn't know. yapyak rendered in the system time zone.

## Docs URL pattern

Every diagnostic message includes a `See` URL pointing to its docs entry. The URL format is `https://yapyak.dev/d/<code-lowercased>` — `yap0017` for `YAP0017`, and so on. Click through (or hover in your editor) for the in-context explanation.
