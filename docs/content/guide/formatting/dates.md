---
title: Dates
order: 3
---

Two methods: `dateTime` for absolute date and time formatting via [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat), and `relativeTime` for `'yesterday'`-style phrasing via [`Intl.RelativeTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat).

```ts
import { format } from 'yapyak';

format.dateTime(new Date());                                       // 'Nov 12, 2025, 3:42 PM' on en
format.dateTime(new Date(), { dateStyle: 'medium' });              // 'Nov 12, 2025' on en
format.dateTime(new Date(), { timeStyle: 'short' });               // '3:42 PM' on en
format.relativeTime(-1, 'day');                                    // '1 day ago' on en, 'för 1 dag sedan' on sv
```

## format.dateTime

```ts
format.dateTime(value: Date | number, options?: FormatDateTimeOptions): string
```

`FormatDateTimeOptions` is [`Intl.DateTimeFormatOptions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options) minus `localeMatcher`. Use `dateStyle` for date-only, `timeStyle` for time-only, both for the combined form, or individual field options (`year`, `month`, `day`, `hour`, `minute`, etc.) for finer control.

### Default

When `options` is omitted, yapyak falls back to `{ dateStyle: 'medium', timeStyle: 'short' }`.

```ts
format.dateTime(new Date());
// 'Nov 12, 2025, 3:42 PM' on en, '12 nov. 2025 15:42' on sv
```

### Date-only

```ts
format.dateTime(new Date('2025-11-12'), { dateStyle: 'medium' });
// 'Nov 12, 2025' on en

format.dateTime(new Date('2025-11-12'), { dateStyle: 'full' });
// 'Wednesday, November 12, 2025' on en

format.dateTime(new Date('2025-11-12'), {
  day: 'numeric',
  month: 'short',
});
// 'Nov 12' on en
```

### Time-only

```ts
format.dateTime(new Date(), { timeStyle: 'short' });
// '3:42 PM' on en, '15:42' on sv

format.dateTime(new Date(), { timeStyle: 'long' });
// '3:42:18 PM PST' on en

format.dateTime(new Date(), { hour: 'numeric' });
// '3 PM' on en
```

### Combined

```ts
format.dateTime(new Date(), {
  dateStyle: 'full',
  timeStyle: 'long',
});
// 'Wednesday, November 12, 2025 at 3:42:18 PM PST' on en
```

### Empty options

The default applies when `options` is `undefined` or an empty object `{}`. Any non-empty options object replaces the default — yapyak does not merge.

::: warning
`format.dateTime(now, { timeZone: 'UTC' })` drops the `{ dateStyle, timeStyle }` default and uses `Intl`'s own default. Spell out the styles to keep them alongside an extra option.
:::

```ts
const now = new Date();

format.dateTime(now);                                          // 'Nov 12, 2025, 3:42 PM' on en — default applied
format.dateTime(now, {});                                      // 'Nov 12, 2025, 3:42 PM' on en — default applied
format.dateTime(now, { timeZone: 'UTC' });                     // '11/12/2025, 11:42 PM' on en — default DROPPED
format.dateTime(now, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});                                                            // 'Nov 12, 2025, 11:42 PM' on en — both
```

## format.relativeTime

```ts
format.relativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options?: FormatRelativeTimeOptions): string
```

The unit is positional, not in options. Accepted values: `'year'`, `'quarter'`, `'month'`, `'week'`, `'day'`, `'hour'`, `'minute'`, `'second'`.

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
