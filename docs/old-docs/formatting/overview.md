---
title: Overview
order: 1
---

`format` is a thin layer over the platform [`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) constructors. One method per underlying `Intl.*Format` class. Each method reads the active locale on every call and forwards options to `Intl` — yapyak applies no defaults of its own.

```ts
import { format } from 'yapyak';

format.number(1234.5);                                          // '1,234.5' on en, '1 234,5' on sv
format.number(199, { style: 'currency', currency: 'EUR' });     // '€199.00' on en, '199,00 €' on sv
format.dateTime(new Date(), { dateStyle: 'medium' });           // 'Nov 12, 2025' on en
format.list(['apples', 'pears']);                               // 'apples and pears' on en
format.relativeTime(-1, 'day');                                 // '1 day ago' on en
```

## Available methods

| Method | Underlying `Intl` class | Notes |
|---|---|---|
| `number` | `Intl.NumberFormat` | Discriminated union on `style` — decimal, currency, percent, unit |
| `dateTime` | `Intl.DateTimeFormat` | Supply `dateStyle`, `timeStyle`, both, or individual fields |
| `list` | `Intl.ListFormat` | Joins iterables of strings |
| `relativeTime` | `Intl.RelativeTimeFormat` | `'yesterday'`-style phrasing |
| `in` | — | Returns a `Format` scoped to a fixed locale |

Topics by page: [Numbers](./numbers.md), [Dates](./dates.md), [Lists](./lists.md), [Override](./override.md).

## Locale resolution

`format.X(...)` reads the active locale from [getLocale()](/guide/locales/runtime) on every call. Switching locale at runtime affects the next call immediately — there is no captured value.

```ts
import { format, setLocale } from 'yapyak';

format.number(1234.5);  // '1,234.5' on en
setLocale('sv');
format.number(1234.5);  // '1 234,5' on sv — same call, new output
```

To force a locale regardless of the active one, see [Override](./override.md).

## Errors

yapyak handles two failure modes gracefully and forwards the rest to `Intl`:

- **Unsupported currency code** — yapyak warns once per `(locale, code)` pair and renders `'<value> <code>'` so React, Svelte, Vue, and Solid trees never unmount. See [Numbers](./numbers.md#unsupported-currency-codes).
- **Invalid dates** — `Intl.DateTimeFormat` returns `'Invalid Date'`. yapyak does not intercept.
- **`NaN`** — the locale's `NaN` string from `Intl.NumberFormat`.
- **Unsupported `relativeTime` units** — `RangeError` from `Intl`.

## Memoization

Every method constructs its underlying `Intl` formatter once per `(constructor, locale, options)` combination and caches it. `format.number(1234.5)` called a thousand times costs one constructor; passing `{ maximumFractionDigits: 2 }` builds a second. The cache is bounded by an LRU per constructor and not configurable.

## The Format type

`Format` is the type of `format` and of every `Format` returned by `.in()`. It exposes the five methods above. Import it when you build wrappers or scoped accessors.

```ts
import type { Format } from 'yapyak';

function buildReceipt(formatter: Format) {
  return {
    total: (amount: number, currency: string) =>
      formatter.number(amount, { style: 'currency', currency }),
    placedAt: (when: Date) => formatter.dateTime(when, { dateStyle: 'long' }),
  };
}
```
