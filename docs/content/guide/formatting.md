---
title: Formatting
order: 5
---

`format` renders locale-aware values: numbers, currency, dates, lists, relative time. It's the sibling of `t()`: where `t()` translates strings, `format` formats values for the active locale. Every method is backed by `Intl`, so the options are the native `Intl.*Options`.

```tsx
import { format } from 'yapyak';

format.number(1234.5); // '1,234.5'
format.currency(499, 'EUR'); // '€499.00'
format.percent(0.42); // '42%'
```

## Numbers

`format.number`, `format.currency`, and `format.percent` take native `Intl.NumberFormatOptions`:

```tsx
format.number(1234.5, { maximumFractionDigits: 0 }); // '1,235'
format.currency(499, 'EUR', { currencyDisplay: 'narrowSymbol' });
```

`currency` needs an explicit ISO 4217 code as its second argument. `percent` treats its input as a fraction, so `0.42` renders as `42%`.

## Dates and times

`format.date`, `format.time`, and `format.dateTime` take native `Intl.DateTimeFormatOptions`:

```tsx
format.date(new Date()); // e.g. 'Jan 15, 2026'
format.time(new Date()); // e.g. '3:45 PM'
format.dateTime(new Date(), { dateStyle: 'long' });
```

With no options they default to `{ dateStyle: 'medium' }`, `{ timeStyle: 'short' }`, and `{ dateStyle: 'medium', timeStyle: 'short' }` respectively.

## Lists and relative time

```tsx
format.list(['apples', 'pears', 'plums']); // 'apples, pears, and plums'
format.relativeTime(-2, 'day'); // '2 days ago'
format.relativeTime(3, 'hour'); // 'in 3 hours'
```

`list` joins with the active locale's conventions. Pass `{ type: 'disjunction' }` for an `'or'`-style join. `relativeTime` renders negative offsets in the past and positive ones in the future.

## Forced locale

Scope formatting to a specific locale with `format.in(locale)`, the same way `t.in` works. The bound formatter is a reusable value:

```tsx
format.in('sv').number(1234.5); // '1 234,5'

const sv = format.in('sv');
sv.currency(499, 'SEK');
sv.date(new Date());
```

Useful for the same cases as `t.in`: rendering in a recipient's locale, generating an audit trail, or previewing another user's view.
