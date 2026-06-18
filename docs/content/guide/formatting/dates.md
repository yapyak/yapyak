---
title: Dates
order: 3
---

`format.dateTime()` formats an absolute date or time for the active locale. `format.relativeTime()` formats a signed offset ("yesterday", "in 3 days"). Both are thin wrappers over `Intl` — they read the active locale on every call, so the same component renders correctly for every reader.

```ts
import { format } from 'yapyak';

format.dateTime(new Date(), { dateStyle: 'long' });
```

{% output %}
en: 'June 17, 2026'
sv: '17 juni 2026'
de: '17. Juni 2026'
{% /output %}

## Absolute date and time

`format.dateTime(value, options)` accepts a `Date` instance or a millisecond timestamp.

### Date only

```ts
format.dateTime(new Date(), { dateStyle: 'short' });
```

{% output %}
en: '6/17/26'
{% /output %}

```ts
format.dateTime(new Date(), { dateStyle: 'medium' });
```

{% output %}
en: 'Jun 17, 2026'
{% /output %}

```ts
format.dateTime(new Date(), { dateStyle: 'long' });
```

{% output %}
en: 'June 17, 2026'
{% /output %}

```ts
format.dateTime(new Date(), { dateStyle: 'full' });
```

{% output %}
en: 'Wednesday, June 17, 2026'
{% /output %}

### Time only

```ts
format.dateTime(new Date(), { timeStyle: 'short' });
```

{% output %}
en: '4:30 PM'
sv: '16:30'
{% /output %}

```ts
format.dateTime(new Date(), { timeStyle: 'full' });
```

{% output %}
en: '4:30:15 PM Central European Summer Time'
{% /output %}

### Date and time together

```ts
format.dateTime(new Date(), {
  dateStyle: 'medium',
  timeStyle: 'short',
});
```

{% output %}
en: 'Jun 17, 2026, 4:30 PM'
{% /output %}

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
```

{% output %}
en: '06/17/2026, 16:30'
{% /output %}

Any option from [`Intl.DateTimeFormatOptions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters) works (minus `localeMatcher`, which yapyak manages). `timeZone`, `weekday`, `era`, `dayPeriod`, fractional seconds — they all pass through.

## Relative time

`format.relativeTime(value, unit, options)` renders a signed offset as a phrase the user reads naturally. Negative values are in the past, positive in the future.

```ts
format.relativeTime(-1, 'day');
```

{% output %}
en: '1 day ago'
sv: 'för 1 dag sedan'
{% /output %}

```ts
format.relativeTime(3, 'hour');
```

{% output %}
en: 'in 3 hours'
sv: 'om 3 timmar'
{% /output %}

### Auto-replace common values with words

`numeric: 'auto'` tells the formatter to use `'yesterday'`, `'tomorrow'`, `'next month'` when the locale has a natural word for the offset:

```ts
format.relativeTime(-1, 'day', { numeric: 'auto' });
```

{% output %}
en: 'yesterday'
sv: 'igår'
{% /output %}

```ts
format.relativeTime(0, 'day', { numeric: 'auto' });
```

{% output %}
en: 'today'
{% /output %}

```ts
format.relativeTime(1, 'day', { numeric: 'auto' });
```

{% output %}
en: 'tomorrow'
{% /output %}

For offsets the locale doesn't have a special word for, `numeric: 'auto'` falls back to the numeric phrase.

## Inside a `t()` message

The same date/time formatting is available [inside ICU messages](/guide/writing/plurals#dates-and-times) — `{when, date, long}`, `{at, time, short}`. Use `t()` when the date is part of a sentence ("Updated on June 17"); use `format.dateTime()` when it's its own atom (a column header, a footer timestamp).

Relative time doesn't have an ICU sub-format; it's only available through `format.relativeTime()`.
