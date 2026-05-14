---
title: Translations
---

`t()` is the runtime API. It takes a source string literal and optional params, and returns the right variant for the current locale.

## Parameters

Placeholders use `{name}`:

```tsx
t('Hello, {name}!', { name: 'Alex' });
// 'Hello, Alex!'
```

TypeScript reads the placeholders from the source literal and requires them as params. Forget one and the compiler stops you.

## Plurals and selects

ICU MessageFormat — plural, selectordinal, select:

```tsx
t('You have {count, plural, one {# item} other {# items}}', { count: 1 });

t('{gender, select, male {his} female {her} other {their}} cart', { gender: 'female' });
```

CLDR plural categories resolve per-locale via `Intl.PluralRules`. All categories ship in, including the four Polish plural forms.

## Forced locale

`t.in()` returns a one-off t locked to a specific locale. The locale is resolved at call time, so a variable works:

```tsx
const message = t.in(user.locale)('Welcome back, {name}!', { name: user.name });
```

Useful when the target locale isn't the current one — sending an email in the recipient's language, generating an audit trail, or rendering a preview for another user.

## Per-file scoping

The same source string in two files becomes two independent entries. yapyak keys translations by `(file path, source string)`, so "Save" in a button can translate differently from "Save" in a menu.

## Constraints

The first argument to `t()` must be a static string literal. Anything else fails at build time:

```tsx
t('Save changes')                  // ✓
t(`Save changes`)                  // ✓ no-substitution template
t(`Hello ${name}`)                 // ✗ build error — template interpolation
t(message)                         // ✗ build error — dynamic argument
```

Extraction reads the source statically, so dynamic input has nothing to extract. When a value depends on a condition, write both literals:

```tsx
{condition ? t('Save') : t('Cancel')}
```
