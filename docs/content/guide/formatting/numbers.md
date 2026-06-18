---
title: Numbers
order: 2
---

Numbers, currencies, percentages, and units all live in `format.number()`. It's a thin wrapper over [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) that reads the active locale every time it's called, so a single component renders correctly for every reader.

```ts
import { format } from 'yapyak';

format.number(1234.5);
// '1,234.5'   in en-US
// '1 234,5'   in sv-SE
// '1.234,5'   in de-DE
```

The `style` option discriminates between four formatting modes. Each one types its own extra options.

## Decimal

The default. Renders a plain number with the locale's grouping and decimal conventions.

```ts
format.number(1000000);
// '1,000,000'   in en-US
// '1 000 000'   in sv-SE

format.number(3.14159, { maximumFractionDigits: 2 });
// '3.14'        in en-US

format.number(0.5, { minimumFractionDigits: 2 });
// '0.50'        in en-US
```

You can pass any of `Intl.NumberFormat`'s decimal options — minimum/maximum fraction digits, minimum integer digits, grouping toggles, notation modes.

## Currency

For prices. `style: 'currency'` requires a `currency` field with an ISO 4217 code.

```ts
format.number(199, { style: 'currency', currency: 'USD' });
// '$199.00'      in en-US
// '199,00 US$'   in sv-SE

format.number(199, { style: 'currency', currency: 'EUR' });
// '€199.00'      in en-US
// '199,00 €'     in fr-FR

format.number(199, { style: 'currency', currency: 'SEK' });
// 'SEK 199.00'   in en-US
// '199,00 kr'    in sv-SE
```

Extra options on the currency branch:

```ts
format.number(199, {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',  // 'symbol' | 'narrowSymbol' | 'code' | 'name'
  currencySign: 'accounting',       // 'standard' | 'accounting'
});
```

`currencyDisplay: 'name'` produces "199.00 US dollars" / "199,00 amerikanska dollar" — useful for accessible labels.

{% callout variant="info" %}
A currency code unsupported by the host `Intl` does not throw — yapyak falls back to a `<value> <code>` rendering. This covers the rare cases where a runtime is missing a freshly-issued currency code (e.g. a regional digital currency) without crashing the page.
{% /callout %}

## The `Currency` type and `isCurrency`

For type-safe `currency` arguments, yapyak ships a `Currency` literal union covering every code returned by `Intl.supportedValuesOf('currency')`, plus an `isCurrency` type guard:

```ts
import { isCurrency, format, type Currency } from 'yapyak';

function setPrice(amount: number, currency: Currency) {
  return format.number(amount, { style: 'currency', currency });
}

const code = readFromForm();        // string
if (isCurrency(code)) {
  setPrice(199, code);              // narrowed to Currency
}
```

Use `Currency` for typed props and parameters; use `isCurrency` to narrow user input before calling `setPrice`.

## Percent

`style: 'percent'` formats fractional values. The input is the decimal fraction — `0.42` renders as `42%`, not `0.42%`.

```ts
format.number(0.42, { style: 'percent' });
// '42%'   in en-US
// '42 %'  in sv-SE

format.number(0.4256, { style: 'percent', maximumFractionDigits: 1 });
// '42.6%'
```

This always trips people up at least once. If your value is already in "percent units" (`42` for "forty-two percent"), divide by 100 before passing it in.

## Unit

`style: 'unit'` formats with an ISO unit identifier. The `unit` field is required.

```ts
format.number(5, { style: 'unit', unit: 'kilometer' });
// '5 km'             in en-US
// '5 km'             in sv-SE

format.number(5, { style: 'unit', unit: 'kilometer', unitDisplay: 'long' });
// '5 kilometers'     in en-US
// '5 kilometer'      in sv-SE

format.number(72, { style: 'unit', unit: 'mile-per-hour' });
// '72 mph'           in en-US
```

`unitDisplay` accepts `'short'` (default), `'narrow'`, or `'long'`. The unit identifiers come from the [Unicode CLDR units list](https://unicode-org.github.io/cldr/ldml/tr35-general.html#Unit_Elements) — common ones include `kilometer`, `mile`, `liter`, `kilogram`, `hour`, `degree`, `byte`, `percent`.

## Inside a `t()` message

The same number formatting is available [inside ICU messages](/guide/writing/plurals#numbers) — `{value, number, currency USD}`, `{pct, number, percent}`, and so on. Use `t()` when the number is part of a sentence; use `format.number()` when the number is its own atom (a column in a table, a stat in a card, a price label next to a button).

## See also

- [Plurals](/guide/writing/plurals) — number-driven branches inside a translated message
- [Dates](/guide/formatting/dates) — date, time, and relative-time formatting
- [Overrides](/guide/formatting/overrides) — `format.in(locale)` for one-off scoped formatting
