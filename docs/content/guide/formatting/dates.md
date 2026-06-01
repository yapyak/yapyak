---
title: Dates
order: 3
---

Date and time formatting through [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat), plus `relativeTime` for "yesterday"-style phrasing via [`Intl.RelativeTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat). The three plain-date methods carry defaults — there is no neutral way to render a `Date`, so yapyak picks `medium`.

```ts
import { format } from 'yapyak';

format.date(new Date());           // 'Nov 12, 2025' on en, '12 nov. 2025' on sv
format.time(new Date());           // '3:42 PM' on en, '15:42' on sv
format.dateTime(new Date());       // 'Nov 12, 2025, 3:42 PM' on en
format.relativeTime(-1, 'day');    // '1 day ago' on en, 'för 1 dag sedan' on sv
```

## format.date

Formats a date. Default options: `{ dateStyle: 'medium' }`. Accepts any [`Intl.DateTimeFormatOptions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options).

```ts
format.date(value: Date | number, options?: Intl.DateTimeFormatOptions): string
```

```ts
format.date(new Date('2025-11-12'));
// 'Nov 12, 2025' on en

format.date(new Date('2025-11-12'), { dateStyle: 'full' });
// 'Wednesday, November 12, 2025' on en

format.date(new Date('2025-11-12'), { day: 'numeric', month: 'short' });
// 'Nov 12' on en
```

## format.time

Formats a time. Default options: `{ timeStyle: 'short' }`.

```ts
format.time(value: Date | number, options?: Intl.DateTimeFormatOptions): string
```

```ts
format.time(new Date());                                       // '3:42 PM' on en, '15:42' on sv
format.time(new Date(), { timeStyle: 'long' });                // '3:42:18 PM PST' on en
format.time(new Date(), { hour: 'numeric' });                  // '3 PM' on en
```

## format.dateTime

Formats date and time together. Default options: `{ dateStyle: 'medium', timeStyle: 'short' }`.

```ts
format.dateTime(value: Date | number, options?: Intl.DateTimeFormatOptions): string
```

```ts
format.dateTime(new Date());
// 'Nov 12, 2025, 3:42 PM' on en

format.dateTime(new Date(), { dateStyle: 'full', timeStyle: 'long' });
// 'Wednesday, November 12, 2025 at 3:42:18 PM PST' on en
```

## format.relativeTime

Formats a relative time expression. The unit is positional, not in options. Accepted values come from [`Intl.RelativeTimeFormatUnit`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/format#unit): `'year'`, `'quarter'`, `'month'`, `'week'`, `'day'`, `'hour'`, `'minute'`, `'second'`.

```ts
format.relativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions): string
```

Negative is past, positive is future:

```ts
format.relativeTime(-1, 'day');                                // '1 day ago' on en
format.relativeTime(2, 'hour');                                // 'in 2 hours' on en
format.relativeTime(-7, 'day');                                // '7 days ago' on en
```

Pass `{ numeric: 'auto' }` for phrases like `'yesterday'` and `'next week'`:

```ts
format.relativeTime(-1, 'day', { numeric: 'auto' });           // 'yesterday' on en, 'i går' on sv
format.relativeTime(1, 'week', { numeric: 'auto' });           // 'next week' on en
format.relativeTime(0, 'day', { numeric: 'auto' });            // 'today' on en
```

## Empty options

Date defaults apply when `options` is `undefined` or an empty object `{}`. They do not apply when you pass any other options object.

::: warning
Passing a non-empty options object replaces the default — yapyak does not merge. `format.date(now, { timeZone: 'UTC' })` drops `dateStyle: 'medium'`; `format.date(now)` keeps it.
:::

```ts
format.date(now);                                              // 'Nov 12, 2025' on en — default applied
format.date(now, {});                                          // 'Nov 12, 2025' on en — default applied
format.date(now, { timeZone: 'UTC' });                         // '11/12/2025' on en — default DROPPED
format.date(now, { dateStyle: 'medium', timeZone: 'UTC' });    // 'Nov 12, 2025' on en — both
```

Spell out both fields to keep the default style alongside an extra option.
