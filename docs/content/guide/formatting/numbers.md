---
title: Numbers
order: 2
---

Numbers, currencies, percentages, and units all live in `format.number()`. It's a thin wrapper over [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) that reads the active locale every time it's called, so a single component renders correctly for every reader.

```ts
import { format } from 'yapyak';

format.number(1234.5);
```

{% output %}
en-US: '1,234.5'
sv-SE: '1 234,5'
de-DE: '1.234,5'
{% /output %}

The `style` option discriminates between four formatting modes. Each one types its own extra options.

## Decimal

The default. Renders a plain number with the locale's grouping and decimal conventions.

```ts
format.number(1000000);
```

{% output %}
en-US: '1,000,000'
sv-SE: '1 000 000'
{% /output %}

```ts
format.number(3.14159, { maximumFractionDigits: 2 });
```

{% output %}
en-US: '3.14'
{% /output %}

```ts
format.number(0.5, { minimumFractionDigits: 2 });
```

{% output %}
en-US: '0.50'
{% /output %}

You can pass any of `Intl.NumberFormat`'s decimal options — minimum/maximum fraction digits, minimum integer digits, grouping toggles, notation modes.

## Currency

For prices. `style: 'currency'` requires a `currency` field with an ISO 4217 code.

```ts
format.number(199, {
  currency: 'USD',
  style: 'currency'
});
```

{% output %}
en-US: '$199.00'
sv-SE: '199,00 US$'
{% /output %}

```ts
format.number(199, {
  currency: 'EUR',
  style: 'currency'
});
```

{% output %}
en-US: '€199.00'
fr-FR: '199,00 €'
{% /output %}

```ts
format.number(199, {
  currency: 'SEK',
  style: 'currency'
});
```

{% output %}
en-US: 'SEK 199.00'
sv-SE: '199,00 kr'
{% /output %}

{% callout variant="info" %}
A currency code unsupported by the host `Intl` does not throw — yapyak falls back to a `<value> <code>` rendering. This covers the rare cases where a runtime is missing a freshly-issued currency code (e.g. a regional digital currency) without crashing the page.
{% /callout %}

## The `Currency` type and `isCurrency`

For type-safe `currency` arguments, yapyak ships a `Currency` literal union covering every code returned by `Intl.supportedValuesOf('currency')`, plus an `isCurrency` type guard:

```ts
import { isCurrency, format, type Currency } from 'yapyak';

function setPrice(amount: number, currency: Currency) {
  return format.number(amount, {
    style: 'currency',
    currency
  });
}

const code = readFromForm();

if (isCurrency(code)) {
  setPrice(199, code);
}
```

Use `Currency` for typed props and parameters; use `isCurrency` to narrow user input before calling `setPrice`.

## Percent

`style: 'percent'` formats fractional values. The input is the decimal fraction — `0.42` renders as `42%`, not `0.42%`.

```ts
format.number(0.42, { style: 'percent' });
```

{% output %}
en-US: '42%'
sv-SE: '42 %'
{% /output %}

```ts
format.number(0.4256, {
  maximumFractionDigits: 1,
  style: 'percent'
});
```

{% output %}
'42.6%'
{% /output %}

If your value is already in "percent units" (`42` for "forty-two percent"), divide by 100 before passing it in.

## Unit

`style: 'unit'` formats with an ISO unit identifier. The `unit` field is required.

```ts
format.number(5, {
  style: 'unit',
  unit: 'kilometer'
});
```

{% output %}
en-US: '5 km'
sv-SE: '5 km'
{% /output %}

```ts
format.number(5, {
  style: 'unit',
  unit: 'kilometer',
  unitDisplay: 'long'
});
```

{% output %}
en-US: '5 kilometers'
sv-SE: '5 kilometer'
{% /output %}

```ts
format.number(72, {
  style: 'unit',
  unit: 'mile-per-hour'
});
```

{% output %}
en-US: '72 mph'
{% /output %}

Unit identifiers come from the [Unicode CLDR units list](https://unicode-org.github.io/cldr/ldml/tr35-general.html#Unit_Elements).

## Inside a `t()` message

The same number formatting is available [inside ICU messages](/guide/writing/plurals#numbers) — `{value, number, currency USD}`, `{pct, number, percent}`, and so on. Use `t()` when the number is part of a sentence; use `format.number()` when the number is its own atom (a column in a table, a stat in a card, a price label next to a button).
