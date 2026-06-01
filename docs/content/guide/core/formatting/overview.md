---
title: Overview
order: 1
description: format is a thin layer over the platform Intl constructors. Eight formatting methods plus a locale-scoping factory.
---

`format` is a thin layer over the platform [`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) constructors. It reads the active locale on every call, applies a default only to the date methods, and never validates input — pass it `NaN` and you get whatever your locale's `Intl` decided `NaN` looks like.

```ts
import { format } from 'yapyak';

format.number(1234.5);          // '1,234.5' on en, '1 234,5' on sv
format.currency(199, 'EUR');    // '€199.00' on en, '199,00 €' on sv
format.date(new Date());        // 'Nov 12, 2025' on en
```

## Available methods

| Method | Formats | Default |
|---|---|---|
| number | decimals and integers | none |
| currency | currency amounts | forces `style: 'currency'` |
| percent | fractions as percentages | forces `style: 'percent'` |
| date | dates | `{ dateStyle: 'medium' }` |
| time | times | `{ timeStyle: 'short' }` |
| dateTime | dates with times | `{ dateStyle: 'medium', timeStyle: 'short' }` |
| relativeTime | relative time expressions | none |
| list | string lists | none |

Topics by page: [Numbers](./numbers.md), [Dates](./dates.md), [Lists](./lists.md), [Override](./override.md).

## Locale resolution

`format.X(...)` reads the active locale from [getLocale()](/guide/core/locales#switching-locale) on every call. Switching locale at runtime affects the next call immediately — there is no captured value.

```ts
import { format, setLocale } from 'yapyak';

format.number(1234.5);  // '1,234.5' on en
setLocale('sv');
format.number(1234.5);  // '1 234,5' on sv — same call, new output
```

To force a locale regardless of the active one, see [Override](./override.md).

## Errors

yapyak does not validate format inputs. Invalid values reach `Intl` directly:

- `'Invalid Date'` for non-dates passed to date methods
- The locale's `NaN` string for `NaN`
- `RangeError` for unknown currency codes
- `RangeError` for unsupported `relativeTime` units

The behavior is deliberately the platform's.

## Memoization

Every method constructs its underlying `Intl` formatter once per `(constructor, locale, options)` combination and caches it for the process lifetime. `format.number(1234.5)` called a thousand times costs one constructor; passing `{ maximumFractionDigits: 2 }` builds a second.

The cache is not configurable, not size-bounded, and not exposed.

## The Format type

`Format` is exported from `'yapyak'` for typing parameters or return values:

```ts
import type { Format } from 'yapyak';

function renderAmount(value: number, formatter: Format): string {
  return formatter.currency(value, 'EUR');
}
```
