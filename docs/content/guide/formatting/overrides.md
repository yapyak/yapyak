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


