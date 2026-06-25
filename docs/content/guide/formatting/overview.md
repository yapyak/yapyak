---
title: Overview
order: 1
---

yapyak ships a runtime `format` namespace backed by `Intl`. Every call uses the active locale automatically, and the options surface adds a small layer of type-safety on top of the platform API.

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
| `format.number` | `Intl.NumberFormat` |
| `format.dateTime` | `Intl.DateTimeFormat` |
| `format.list` | `Intl.ListFormat` |
| `format.relativeTime` | `Intl.RelativeTimeFormat` |

## What it adds beyond `Intl`

**Currency type-safety.** When `style: 'currency'`, the `currency` field is required and typed against ISO 4217. The `Currency` type is exported separately for passing through your own functions. See [Numbers](/guide/formatting/numbers#currency) for the full pattern.

**Required fields per number style.** `format.number`'s options are a discriminated union over `style`. Pick `'percent'` and nothing else is required; pick `'unit'` and the `unit` field becomes mandatory:

{% diagnostics %}
format.number(0.42, { style: 'percent' });                // ok
format.number(45, { style: 'unit', unit: 'kilometer' });  // ok
format.number(45, { style: 'unit' });                     // error: unit missing
{% /diagnostics %}

**Graceful currency fallback.** A currency code unsupported by the host `Intl` doesn't throw. yapyak falls back to a `<value> <code>` rendering so older runtimes don't break your page.

## Scoping to a different locale

By default every `format.*` call uses the active locale. Use `format.in(locale)` to scope a call (or chain) to something else:

```ts
format.in('sv').number(200, {
  currency: 'SEK',
  style: 'currency'
});
// output: '200,00 kr'
```

The result is the same regardless of the active locale. The active locale itself is left untouched.

## When to use `format` vs ICU placeholders

Use `format` for values **outside** a translated message. For values **inside** a `t()` call, prefer ICU placeholders (`{count, number, currency}`). They live next to the translation and the compiler emits the same `Intl.*Format` machinery underneath.
