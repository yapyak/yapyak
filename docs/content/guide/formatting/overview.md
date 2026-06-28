---
title: Overview
order: 1
---

yapyak ships a runtime [`format`](/reference/yapyak/Format) namespace backed by `Intl`. Every call uses the active locale. yapyak's options add a layer of type safety over the platform API.

```ts
import { format } from 'yapyak';

format.number(199, {
  currency: 'EUR',
  style: 'currency'
});
// output:
// en-US: '€199.00'
// sv-SE: '199,00 €'
```

```ts
format.dateTime(new Date(), { dateStyle: 'long' });
// output:
// en-US: 'June 18, 2026'
// sv-SE: '18 juni 2026'
```

```ts
format.list(['apple', 'pear', 'orange']);
// output:
// en-US: 'apple, pear, and orange'
// sv-SE: 'apple, pear och orange'
```

```ts
format.relativeTime(-1, 'day');
// output:
// en-US: '1 day ago'
// sv-SE: 'för 1 dag sedan'
```

Each method maps directly to an `Intl.*Format` class:

| Method | Backed by |
|---|---|
| [`format.number`](/reference/yapyak/format.number) | `Intl.NumberFormat` |
| [`format.dateTime`](/reference/yapyak/format.dateTime) | `Intl.DateTimeFormat` |
| [`format.list`](/reference/yapyak/format.list) | `Intl.ListFormat` |
| [`format.relativeTime`](/reference/yapyak/format.relativeTime) | `Intl.RelativeTimeFormat` |

## Beyond Intl

### Currency type-safety

When `style: 'currency'`, the `currency` field is required. The [`Currency`](/reference/yapyak/Currency) type autocompletes ISO 4217 codes (it's a `Currency | (string & {})` union, so arbitrary strings still type-check). See [Numbers](/guide/formatting/numbers#currency) for the full pattern.

### Required fields per style

`format.number`'s options are a discriminated union over `style`. Pick `'percent'` and nothing else is required; pick `'unit'` and the `unit` field becomes mandatory:

{% diagnostics %}
format.number(0.42, { style: 'percent' });                // ok
format.number(45, { style: 'unit', unit: 'kilometer' });  // ok
format.number(45, { style: 'unit' });                     // error: unit missing
{% /diagnostics %}

### Graceful currency fallback

A currency code unsupported by the host `Intl` doesn't throw. yapyak falls back to a `<value> <code>` rendering so older runtimes don't break your page, and emits a [`YAP0035`](/reference/diagnostics/YAP0035) diagnostic to flag the unsupported code. The same fallback applies to units ([`YAP0036`](/reference/diagnostics/YAP0036)) and time zones ([`YAP0037`](/reference/diagnostics/YAP0037)).

## Scoping to a different locale

By default every `format.*` call uses the active locale. Use [`format.in(locale)`](/reference/yapyak/format.in) to scope a call (or chain) to something else:

```ts
format.in('sv').number(200, {
  currency: 'SEK',
  style: 'currency'
});
// output: '200,00 kr'
```

The result is the same regardless of the active locale. The active locale itself is left untouched.

## Format vs ICU

Use `format` for values **outside** a translated message. For values **inside** a `t()` call, prefer ICU placeholders (`{count, number, currency}`).
