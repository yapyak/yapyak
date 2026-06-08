---
title: Diagnostics
order: 8
---

yapyak emits diagnostic codes prefixed `YPK` for invalid call sites, malformed translations, and unsupported features. Errors block the build. Warnings surface in the log but do not block.

Several diagnostics are also surfaced as **TypeScript errors** at the call site — they show up under a red squiggle in the IDE before you save. Look for the "Also a TS error" note on each code below.

## Call-site

### YPK101

`t()` or `t.as()` called without a source argument (error).

Pass the source as the first argument:

```ts
t('Save changes');
```

### YPK102

Source argument is not a static string literal, or is a template literal with interpolation (error).

Replace interpolation with an ICU placeholder:

```ts
t(`Hi ${name}`);               // ✗ YPK102
t('Hi {name}', { name });      // ✓
```

### YPK103

Source is an empty string (error). Pass a non-empty string literal.

> **Also a TS error.** `t('')` fails type-checking with `Invalid source: must not be an empty string`.

### YPK104

A placeholder in the source has no matching key in the params object (error).

Add the missing key:

```ts
t('Hi {name}', { count: 1 }); // ✗ YPK104
t('Hi {name}', { name });     // ✓
```

### YPK105

Params object has a key with no matching placeholder (warning). Remove the unused key or add the corresponding `{key}` placeholder to the source.

### YPK106

Params passed as a variable or with spread instead of an inline object literal (warning).

Pass an inline object literal to enable static validation:

```ts
const p = { name: 'Alex' };
t('Hi {name}', p);              // ⚠ YPK106
t('Hi {name}', { name: 'Alex' }); // ✓
```

## ICU

### YPK201

Malformed ICU syntax (error). Check that every `{` has a matching `}`.

### YPK202

A `plural`, `selectordinal`, or `select` placeholder is missing the required `other` branch (error).

Add `other {<text>}` as one of the branches:

```ts
t('{n, plural, one {# item} other {# items}}', { n });
```

> **Also a TS error.** `t('{n, plural, one {x}}')` fails type-checking with `Plural "{n}" is missing the required 'other' branch`.

### YPK203

Unsupported ICU feature (error). See [ICU § Limits](./icu#limits) for the full list of unsupported features and their workarounds.

> **Also a TS error (partial).** Unknown ICU format keywords (e.g. `{x, plurral, ...}`) fail type-checking with `Unknown ICU format "plurral" — expected one of: plural, selectordinal, select, number, date, time`. Other YPK203 variants (number skeleton, plural offset, etc.) are caught only at build time.

## Locale files

### YPK204

A placeholder kind in the translation differs from the source (error). For example, the source uses `{n, plural, ...}` but the translation has plain `{n}`.

Match the source's placeholder kind in the translation.

### YPK205

A placeholder in the source is missing from the translation (error). Add the placeholder to the translation.

### YPK206

The translation has a placeholder that is not in the source (error). Remove the extra placeholder from the translation, or add it to the source.

### YPK301

A locale file entry is not in the expected shape (error). Entries under a path key must be an object mapping source string to translation, with each value as a string.

### YPK302

A file-path key in the locale file is unsafe (error). Keys must be relative, use forward slashes, and contain no `..` segments.

### YPK303

A translation string is not in Unicode NFC normalization form (error). Normalize the string to NFC before committing.

## Modifiers

### YPK401

The `context` argument to `t.as()` is not a static string literal (error).

Pass a literal string:

```ts
t.as(prefix, 'Open');         // ✗ YPK401
t.as('button', 'Open');       // ✓
```

### YPK402

The `t.as()` context contains an `'@'` (error). `'@'` is reserved as the source/context separator.

```ts
t.as('btn@x', 'Open');        // ✗ YPK402 (contains '@')
t.as('primary-cta', 'Open');  // ✓
```

> **Also a TS error.** `t.as('btn@x', ...)` fails type-checking with `Invalid context "btn@x": '@' is reserved as the source/context separator`.

### YPK403

The same source string is used with both `t()` and `t.as()` in the same file (error). Pick one form for every occurrence.

### YPK404

`t.as(context, source)` has no other context to disambiguate from (warning). If only one occurrence of the source exists, `t.as()` has no effect — drop it.

### YPK405

A modifier (`t.as` or `t.in`) is captured in a variable, returned, or passed as an argument instead of used inline (error).

Use modifiers inline:

```ts
const sv = t.in('sv');           // ✗ YPK405 — chain captured
sv.as('button', 'Hello');

t.in('sv', 'Hello');             // ✓ — inline call
t.in('sv').as('button', 'Save'); // ✓ — inline chain
```
