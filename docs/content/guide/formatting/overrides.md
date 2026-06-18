---
title: Overrides
order: 5
---

By default, every `format.*` call renders for the active locale. When you need to format a value in a different locale on a one-off basis, `format.in(locale)` scopes the formatter to a fixed locale for one expression.

```ts
import { format } from 'yapyak';

format.in('sv').number(199, { style: 'currency', currency: 'SEK' });
// '199,00 kr'

format.in('ja').dateTime(new Date(), { dateStyle: 'long' });
// '2026年6月17日'
```

`format.in(locale)` returns a `Format` value with the same methods as the top-level `format`. You chain whatever you need:

```ts
format.in('sv').number(value);
format.in('sv').dateTime(date);
format.in('sv').list(items);
format.in('sv').relativeTime(offset, unit);
```

The `locale` argument is typed against your [`Locale`](/guide/getting-started/installation) union, so an unknown code is a compile-time error.

## When to use it

Reach for `format.in()` when you genuinely need a value rendered in a non-active locale. Typical cases:

- **Server-rendered email or invoice.** The HTTP request might be in English, but the recipient prefers Swedish — render their currency and dates accordingly.
- **Admin previews and comparison views.** Show how a price reads in every supported market without switching the whole page's locale.
- **Notifications with explicit per-recipient locales.** "Welcome, {name}" rendered in the recipient's locale even though the sending agent is on a different one.

For everything else, the active locale is what you want — let the regular `format.*` calls and your locale-switcher handle it.

## What's not reactive

Unlike the active-locale `format`, a `format.in(locale)` call doesn't subscribe to anything. The result is computed once and stays fixed. If the user switches locale, components that called `format.in('sv').number(...)` keep showing the Swedish format — which is exactly the point, but worth keeping in mind when picking between `format.number()` (active locale, reactive) and `format.in('sv').number()` (fixed locale, static).

## Composing with `t.in()`

When you want both, combine [`t.in()`](/guide/writing/overrides) with `format.in()`:

```ts
const balance = format.in('sv').number(199, { style: 'currency', currency: 'SEK' });
t.in('sv', 'Your balance is {balance}', { balance });
// 'Ditt saldo är 199,00 kr'
```

This is the pattern for emails, server-rendered preview cards, and other rendering moments that need a fully-fixed locale across all the text and all the numbers.
