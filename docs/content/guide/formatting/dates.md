---
title: Dates
order: 3
---

`format.dateTime()` formats an absolute date or time for the active locale. `format.relativeTime()` formats a signed offset ("yesterday", "in 3 days"). Both are thin wrappers over `Intl` — they read the active locale on every call, so the same component renders correctly for every reader.

```ts
import { format } from 'yapyak';

format.dateTime(new Date(), { dateStyle: 'long' });
// 'June 17, 2026'   in en-US
// '17 juni 2026'    in sv-SE
// '17. Juni 2026'   in de-DE
```

## Absolute date and time

`format.dateTime(value, options)` accepts a `Date` instance or a millisecond timestamp.

### Date only

```ts
format.dateTime(new Date(), { dateStyle: 'short' });
// '6/17/26'         in en-US

format.dateTime(new Date(), { dateStyle: 'medium' });
// 'Jun 17, 2026'    in en-US

format.dateTime(new Date(), { dateStyle: 'long' });
// 'June 17, 2026'   in en-US

format.dateTime(new Date(), { dateStyle: 'full' });
// 'Wednesday, June 17, 2026'   in en-US
```

### Time only

```ts
format.dateTime(new Date(), { timeStyle: 'short' });
// '4:30 PM'         in en-US
// '16:30'           in sv-SE

format.dateTime(new Date(), { timeStyle: 'full' });
// '4:30:15 PM Central European Summer Time'   in en-US
```

### Date and time together

```ts
format.dateTime(new Date(), {
  dateStyle: 'medium',
  timeStyle: 'short',
});
// 'Jun 17, 2026, 4:30 PM'   in en-US
```

### Finer control with field options

When the preset styles don't fit, pass individual field options:

```ts
format.dateTime(new Date(), {
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
// '06/17/2026, 16:30'   in en-US
```

Any option from [`Intl.DateTimeFormatOptions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters) works (minus `localeMatcher`, which yapyak manages). `timeZone`, `weekday`, `era`, `dayPeriod`, fractional seconds — they all pass through.

## Relative time

`format.relativeTime(value, unit, options)` renders a signed offset as a phrase the user reads naturally. Negative values are in the past, positive in the future.

```ts
format.relativeTime(-1, 'day');
// '1 day ago'        in en-US
// 'för 1 dag sedan'  in sv-SE

format.relativeTime(3, 'hour');
// 'in 3 hours'       in en-US
// 'om 3 timmar'      in sv-SE
```

### Auto-replace common values with words

`numeric: 'auto'` tells the formatter to use `'yesterday'`, `'tomorrow'`, `'next month'` when the locale has a natural word for the offset:

```ts
format.relativeTime(-1, 'day', { numeric: 'auto' });
// 'yesterday'    in en-US
// 'igår'         in sv-SE

format.relativeTime(0, 'day', { numeric: 'auto' });
// 'today'        in en-US

format.relativeTime(1, 'day', { numeric: 'auto' });
// 'tomorrow'     in en-US
```

For offsets the locale doesn't have a special word for, `numeric: 'auto'` falls back to the numeric phrase.

### Units

Pick the largest unit whose magnitude is comfortable for the offset — "yesterday" reads better than "−24 hours ago". See [`Intl.RelativeTimeFormat` units](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/format#unit) for the accepted values.

```ts
const elapsed = Date.now() - timestamp;
const minutes = Math.round(elapsed / 60_000);

if (minutes < 60) {
  return format.relativeTime(-minutes, 'minute', { numeric: 'auto' });
} else if (minutes < 60 * 24) {
  return format.relativeTime(-Math.round(minutes / 60), 'hour', { numeric: 'auto' });
} else {
  return format.relativeTime(-Math.round(minutes / 1440), 'day', { numeric: 'auto' });
}
```

This pattern — a small "pick the unit" helper around `format.relativeTime` — is what most apps end up with. yapyak doesn't ship one because the right thresholds depend on your context: a chat app and an annual-report viewer want different boundaries.

## Inside a `t()` message

The same date/time formatting is available [inside ICU messages](/guide/writing/plurals#dates-and-times) — `{when, date, long}`, `{at, time, short}`. Use `t()` when the date is part of a sentence ("Updated on June 17"); use `format.dateTime()` when it's its own atom (a column header, a footer timestamp).

Relative time doesn't have an ICU sub-format; it's only available through `format.relativeTime()`.
