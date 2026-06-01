---
title: Translations
order: 1
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

## Supported syntax

yapyak owns a fixed subset of ICU MessageFormat. Everything in this table parses, type-checks, extracts, translates, and formats. The source string is the contract, so what you write here is what the compiler and runtime honor.

| Syntax | Example | Param type |
|---|---|---|
| Simple | `t('Hello, {name}!')` | `string \| number` |
| Number | `{n, number}`, `integer`, `percent`, `currency EUR` | `number` |
| Date | `{d, date}`, `short`, `medium`, `long`, `full` | `Date \| number` |
| Time | `{d, time, short}` | `Date \| number` |
| Plural | `{count, plural, one {# item} other {# items}}` | `number` |
| Selectordinal | `{place, selectordinal, one {#st} other {#th}}` | `number` |
| Select | `{gender, select, female {her} other {their}}` | branch names, or any string when `other` is present |
| Nested | placeholders inside plural or select branches | the inner placeholder's type |

`#` formats the count for the active locale through `Intl.NumberFormat`. A Swedish `{count}` of 1234 renders `1 234`. Currency needs an explicit code, so `currency EUR`, not bare `currency`.

## What fails the build

Everything outside the supported set is a build error, not a silent fallback. The compiler reads every `t()` call and points at the line.

| Rejected | Example | Reason |
|---|---|---|
| Number skeleton | `{n, number, ::currency/EUR}` | no `Intl` mapping |
| Legacy number pattern | `{n, number, #,##0.00}` | no `Intl` mapping |
| Date or time skeleton or pattern | `{d, date, ::yyyyMMdd}`, `{d, date, dd/MM/yyyy}` | no `Intl` mapping |
| Currency without a code | `{cost, number, currency}` | no locale-safe default |
| Plural offset | `{n, plural, offset:1 other {#}}` | not supported |
| Apostrophe escaping | `Send '{count}' files` | the runtime reads `{` as a placeholder |
| Missing `other` branch | `{count, plural, one {# item}}` | plural, selectordinal, and select each need a fallback |
| Malformed ICU | `Hello {name`, `{}`, `{x, mystery, y}` | unbalanced or unknown |

## Type checking

Two layers check a `t()` call, and they catch different things.

TypeScript reads the placeholders from the source literal and type-checks the values you pass against them. It covers flat and shallowly-nested messages, which is almost everything you write.

```tsx
t('{count, plural, one {#} other {#}}', { count: 'three' });    // editor error: count is a number
t('{count, plural, one {# by {author}} other {# by {author}}}', { count: 1, author: 'Alex' }); // both checked
```

Presence is the compiler's job. Write `t('Hello, {name}!')` with no params and the build fails with `YPK104`. Since the compiler runs in the Vite loop, you see it the moment you save.

Deeply-nested ICU is the one place the type layer stops. Template-literal types bottom out a few levels deep, so the innermost param drops from the inferred type. The compiler covers it: it validates every param name at every depth and fails the build on a mismatch. Nothing slips to runtime.

The division runs the other way too. ICU validity, the rejected set above, is a build check rather than an editor check. The editor stays green and the build reports the error.

When params come from a variable instead of an inline object, the compiler can't read the keys statically, so it warns instead of verifying. TypeScript still checks the variable against the source.

```tsx
const params = { count: 1, author: 'Alex' };
t('{count, plural, one {# by {author}} other {# by {author}}}', params); // TS-checked; build warns it can't re-verify
```

## Forced locale

Scope a translator to a specific locale with `t.in(locale)` instead of the ambient one. The locale is resolved at call time, so a variable works:

```tsx
const message = t.in(user.locale)('Welcome back, {name}!', { name: user.name });
```

`t.in(locale)` returns a translator you can reuse. Bind it once and call it as often as you like:

```tsx
const inRecipientLocale = t.in(user.locale);
const subject = inRecipientLocale('Welcome back!');
const body = inRecipientLocale('You have {count} new messages', { count });
```

Useful when the target locale isn't the current one: sending an email in the recipient's language, generating an audit trail, or rendering a preview for another user.

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
