---
title: Diagnostics
order: 8
---

yapyak emits diagnostic codes prefixed `YPK` for invalid call sites, malformed translations, and unsupported features. Errors block the build. Warnings surface in the log but do not block.

## Call-site

### YPK101

`t()` or `t.at()` called without a source argument (error).

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

### YPK203

Unsupported ICU feature (error). See [ICU § Limits](./icu#limits) for the full list of unsupported features and their workarounds.

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

The `context` argument to `t.at()` is not a static string literal (error).

Pass a literal string:

```ts
t.at(prefix, 'Open');         // ✗ YPK401
t.at('action', 'Open');       // ✓
```

### YPK402

The `t.at()` context contains an `'@'` (error). `'@'` is reserved as the source/context separator.

```ts
t.at('btn@x', 'Open');        // ✗ YPK402 (contains '@')
t.at('primary-cta', 'Open');  // ✓
```

### YPK403

The same source string is used with both `t()` and `t.at()` in the same file (error). Pick one form for every occurrence.

### YPK404

`t.at(context, source)` has no other context to disambiguate from (warning). If only one occurrence of the source exists, `t.at()` has no effect — drop it.

### YPK405

A modifier (`t.at` or `t.in`) is captured in a variable, returned, or passed as an argument instead of used inline (error).

Use modifiers inline:

```ts
const sv = t.in('sv');           // ✗ YPK405
sv('Hello');

t.in('sv', 'Hello');             // ✓
t.in('sv').at('button', 'Open'); // ✓
```
