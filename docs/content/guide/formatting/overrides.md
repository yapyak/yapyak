---
title: Overrides
order: 5
---

By default, every `format.*` call renders for the active locale. When you need to format a value in a different locale on a one-off basis, `format.in(locale)` scopes the formatter to a fixed locale for one expression.

```ts
import { format } from 'yapyak';

format.in('sv').number(199, {
  currency: 'SEK',
  style: 'currency'
});
// output: '199,00 kr'
```

```ts
format.in('ja').dateTime(new Date(), { dateStyle: 'long' });
// output: '2026年6月17日'
```

`format.in(locale)` returns a `Format` value with the same methods as the top-level `format`. The `locale` argument is typed against your [`Locale`](/guide/switching/overview) union, so an unknown code is a compile-time error.

## When to use it

Reach for `format.in()` when you genuinely need a value rendered in a non-active locale. Typical cases:

- **Server-rendered email or invoice.** The HTTP request might be in English, but the recipient prefers Swedish. Render their currency and dates accordingly.
- **Admin previews and comparison views.** Show how a price reads in every supported market without switching the whole page's locale.
- **Notifications with explicit per-recipient locales.** "Welcome, {name}" rendered in the recipient's locale even though the sending agent is on a different one.

For everything else, the active locale is what you want. Let the regular `format.*` calls and your locale-switcher handle it.

