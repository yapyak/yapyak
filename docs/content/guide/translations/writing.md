---
title: Writing
order: 2
---

`t()` is the runtime API. It takes a source string and returns the translated value for the active locale:

```tsx
import { t } from 'yapyak';

t('Save changes');
t('You have {count} items', { count: 3 });
```

The source string is the key. yapyak extracts it on save and writes it to your locale files.

## Source string

The source must be a static string literal:

```ts
t('Hello');                 // OK
t(`Hello`);                 // OK — no interpolation
t(`Hi ${name}`);            // YPK102 — use {name} instead
t(message);                 // YPK102 — variable not allowed
t('');                      // YPK103 — empty not allowed
```

If you need dynamic values inside the message, use ICU placeholders. See [ICU](./icu) for the full syntax.

## Parameters

When the source has placeholders, pass an object with matching keys:

```ts
t('Hi {name}', { name: 'Alex' });
t('You have {count} items', { count });
```

Placeholder names in the source are checked against the params keys at compile time:

```ts
t('Hi {name}');               // TS error: missing { name }
t('Hi {name}', { count: 1 }); // YPK104: missing parameter 'name'
```

Pass params as an inline object literal. Variables and spreads work at runtime but cannot be statically verified (YPK106):

```ts
const p = { name: 'Alex' };
t('Hi {name}', p);            // OK at runtime, YPK106 warning
t('Hi {name}', { ...data });  // OK at runtime, YPK106 warning
```

## Modifiers

Two modifiers refine how a source is extracted or which locale is used.

**`t.at(context, source)`** disambiguates identical sources that mean different things in different places:

```tsx
<button>{t.at('action', 'Open')}</button>
<span>{t.at('state', 'Open')}</span>
```

Both calls extract separate entries. See [Homonyms](./homonyms) for the full mechanics.

**`t.in(locale, source)`** forces a fixed locale for one call, regardless of the active locale:

```ts
t.in('en', 'OK');
t.in('sv', 'Hej, {name}', { name: 'Alex' });
```

The two modifiers can be chained:

```ts
t.in('sv').at('button', 'Open');
t.at('button').in('sv', 'Open');
```

Modifiers must be used inline. Capturing the result in a variable, returning it from a function, or passing it as an argument is YPK405:

```ts
const sv = t.in('sv');        // YPK405
sv('Hello');

t.in('sv', 'Hello');          // OK
```

## Diagnostics

| Code | Means |
|---|---|
| [YPK101](./diagnostics#ypk101) | `t()` called without a source argument |
| [YPK102](./diagnostics#ypk102) | Source is not a string literal, or template has interpolation |
| [YPK103](./diagnostics#ypk103) | Source is an empty string |
| [YPK104](./diagnostics#ypk104) | Placeholder has no matching params key |
| [YPK105](./diagnostics#ypk105) | Params key has no matching placeholder |
| [YPK106](./diagnostics#ypk106) | Params passed as variable or spread, cannot be statically verified |
| [YPK401](./diagnostics#ypk401) | `t.at()` context is not a static string literal |
| [YPK402](./diagnostics#ypk402) | Context does not match `[a-z][a-z0-9-]*` |
| [YPK403](./diagnostics#ypk403) | Same source used with both `t()` and `t.at()` in the same file |
| [YPK404](./diagnostics#ypk404) | `t.at()` has no other context to disambiguate from |
| [YPK405](./diagnostics#ypk405) | Modifier captured instead of used inline |

See [Diagnostics](./diagnostics) for the full code list, including ICU and locale-file validation codes.
