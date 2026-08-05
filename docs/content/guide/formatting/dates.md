---
title: Dates
order: 3
---

`format.dateTime()` formats an absolute date or time for the active locale. `format.relativeTime()` formats a signed offset ("1 day ago", "in 3 days").

Both wrap `Intl` and read the active locale on every call.

```ts
import { format } from 'yapyak';

format.dateTime(new Date(), { dateStyle: 'long' });
// output:
// en-US: 'June 17, 2026'
// sv-SE: '17 juni 2026'
// ja-JP: '2026年6月17日'
```

## Absolute date and time

`format.dateTime(value, options)` accepts a `Date` instance or a millisecond timestamp.

### Date only

```ts
format.dateTime(new Date(), { dateStyle: 'short' });
// output: en-US: '6/17/26'
```

```ts
format.dateTime(new Date(), { dateStyle: 'medium' });
// output: en-US: 'Jun 17, 2026'
```

```ts
format.dateTime(new Date(), { dateStyle: 'long' });
// output: en-US: 'June 17, 2026'
```

```ts
format.dateTime(new Date(), { dateStyle: 'full' });
// output: en-US: 'Wednesday, June 17, 2026'
```

### Time only

```ts
format.dateTime(new Date(), { timeStyle: 'short' });
// output:
// en-US: '4:30 PM'
// sv-SE: '16:30'
```

```ts
format.dateTime(new Date(), { timeStyle: 'full' });
// output: en-US: '4:30:15 PM Central European Summer Time'
```

### Date and time together

```ts
format.dateTime(new Date(), {
  dateStyle: 'medium',
  timeStyle: 'short'
});
// output: en-US: 'Jun 17, 2026, 4:30 PM'
```

### Field options

When the preset styles don't fit, pass individual field options:

```ts
format.dateTime(new Date(), {
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  month: '2-digit',
  year: 'numeric'
});
// output: en-US: '06/17/2026, 16:30'
```

Any option from [`Intl.DateTimeFormatOptions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters) works (minus `localeMatcher`, which yapyak manages). `timeZone`, `weekday`, `era`, `dayPeriod`, fractional seconds. They all pass through.

## Relative time

`format.relativeTime(value, unit, options)` formats a time offset. Negative values read as the past (`'1 day ago'`), positive as the future (`'in 3 hours'`).

```ts
format.relativeTime(-1, 'day');
// output:
// en-US: '1 day ago'
// sv-SE: 'för 1 dag sedan'
```

```ts
format.relativeTime(3, 'hour');
// output:
// en-US: 'in 3 hours'
// sv-SE: 'om 3 timmar'
```

### Numeric: auto

`numeric: 'auto'` tells the formatter to use `'yesterday'`, `'tomorrow'`, `'next month'` when the locale has a natural word for the offset:

```ts
format.relativeTime(-1, 'day', { numeric: 'auto' });
// output:
// en-US: 'yesterday'
// sv-SE: 'igår'
```

```ts
format.relativeTime(0, 'day', { numeric: 'auto' });
// output: en-US: 'today'
```

```ts
format.relativeTime(1, 'day', { numeric: 'auto' });
// output: en-US: 'tomorrow'
```

For offsets the locale doesn't have a special word for, `numeric: 'auto'` falls back to the numeric phrase.

## Inside a translation

The same date/time formatting is available [inside ICU messages](/guide/writing/plurals#dates-and-times): `{when, date, long}`, `{at, time, short}`.

Relative time has no ICU sub-format; it's only available through `format.relativeTime()`.
