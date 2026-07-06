---
title: Numbers
order: 2
---

`format.number()` handles numbers, currencies, percentages, and units. It wraps [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) and reads the active locale on every call.

```ts
import { format } from 'yapyak';

format.number(1234.5);
// output:
// en-US: '1,234.5'
// sv-SE: '1 234,5'
// de-DE: '1.234,5'
```

The `style` option discriminates between four formatting modes. Each one types its own extra options.

## Decimal

The default. Renders a plain number with the locale's grouping and decimal conventions.

```ts
format.number(1000000);
// output:
// en-US: '1,000,000'
// sv-SE: '1 000 000'
```

```ts
format.number(3.14159, { maximumFractionDigits: 2 });
// output: en-US: '3.14'
```

```ts
format.number(0.5, { minimumFractionDigits: 2 });
// output: en-US: '0.50'
```

You can pass any of [`Intl.NumberFormat`'s decimal options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#parameters).

## Currency

For prices. `style: 'currency'` requires a `currency` field with an ISO 4217 code.

```ts
format.number(199, {
  currency: 'USD',
  style: 'currency'
});
// output:
// en-US: '$199.00'
// sv-SE: '199,00 US$'
```

```ts
format.number(199, {
  currency: 'EUR',
  style: 'currency'
});
// output:
// en-US: '€199.00'
// fr-FR: '199,00 €'
```

```ts
format.number(199, {
  currency: 'SEK',
  style: 'currency'
});
// output:
// en-US: 'SEK 199.00'
// sv-SE: '199,00 kr'
```

{% callout variant="info" %}
A currency code unsupported by the host `Intl` does not throw. yapyak falls back to a `<value> <code>` rendering.
{% /callout %}

## The Currency type

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

`style: 'percent'` formats fractional values. The input is the decimal fraction. `0.42` renders as `42%`, not `0.42%`.

```ts
format.number(0.42, { style: 'percent' });
// output:
// en-US: '42%'
// sv-SE: '42 %'
```

```ts
format.number(0.4256, {
  maximumFractionDigits: 1,
  style: 'percent'
});
// output: '42.6%'
```

If your value is already a percent (like `42` for "42%"), divide by 100 first.

## Unit

`style: 'unit'` formats with an ISO unit identifier. The `unit` field is required.

```ts
format.number(5, {
  style: 'unit',
  unit: 'kilometer'
});
// output:
// en-US: '5 km'
// sv-SE: '5 km'
```

```ts
format.number(5, {
  style: 'unit',
  unit: 'kilometer',
  unitDisplay: 'long'
});
// output:
// en-US: '5 kilometers'
// sv-SE: '5 kilometer'
```

```ts
format.number(72, {
  style: 'unit',
  unit: 'mile-per-hour'
});
// output: en-US: '72 mph'
```

Unit identifiers come from the [Unicode CLDR units list](https://unicode-org.github.io/cldr/ldml/tr35-general.html#Unit_Elements).

## Inside a translation

The same number formatting is available [inside ICU messages](/guide/writing/plurals#numbers): `{value, number, currency USD}`, `{pct, number, percent}`, etc.
