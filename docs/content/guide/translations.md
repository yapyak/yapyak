---
title: Translations
order: 4
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

### Type-checking limits

TypeScript reads placeholders straight from the source literal. Template-literal types can't fully parse nested ICU, so a few edge cases slip through.

**Caught at compile time:**

- Missing simple placeholder: `t('Hello {name}')` without `name`.
- Typo in placeholder name: `{ nme: 'Alex' }`.
- Missing ICU outer key: `t('{count, plural, ...}')` without `count`.
- Wrong value type for ICU: `{ count: 'three' }` for a plural pattern. Plural and number formats expect `number`, date and time expect `Date | number`, select expects `string`.

**Not caught:**

Nested placeholders inside ICU branches. The type system extracts the outer key only; inner placeholders work at runtime but TypeScript doesn't enforce them.

```tsx
// `author` runs fine at runtime, but TS only enforces `count`
t('You have {count, plural, one {# item by {author}} other {# items by {author}}}',
  { count: 1, author: 'Alex' });
```

For strict typing on nested ICU, declare a typed variable:

```tsx
const params: { count: number; author: string } = { count: 1, author: 'Alex' };
t('You have {count, plural, one {# item by {author}} other {# items by {author}}}', params);
```

## Forced locale

Pass `locale` in the trailing options object to translate in a specific locale instead of the ambient one. The locale is resolved at call time, so a variable works:

```tsx
const message = t('Welcome back, {name}!', { name: user.name }, { locale: user.locale });
```

When the source has no placeholders, the options object goes in the second position:

```tsx
const message = t('Welcome back!', { locale: user.locale });
```

Useful when the target locale isn't the current one — sending an email in the recipient's language, generating an audit trail, or rendering a preview for another user.

## Translator context

Pass `context` in the options object to give the AI translator a hint about how the string is used. It's pure metadata: it never affects the runtime output, only the translation the translator generates.

```tsx
// Source has no placeholders — options is the second argument
t('Save', { context: 'submit button on the new-account form' });

// Source has placeholders — params come first, options second
t('Hello, {name}!', { name: user.name }, { context: 'greeting at the top of the dashboard' });
```

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
