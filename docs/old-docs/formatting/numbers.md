---
title: Numbers
order: 2
---

One method, one [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) underneath. The `style` option selects the rendering — `'decimal'`, `'currency'`, `'percent'`, or `'unit'`. Each style is a separate branch of a discriminated union, so TypeScript only allows the options that style accepts.

```ts
import { format } from 'yapyak';

format.number(1234.5);                                          // '1,234.5' on en, '1 234,5' on sv
format.number(199, { style: 'currency', currency: 'EUR' });     // '€199.00' on en, '199,00 €' on sv
format.number(0.42, { style: 'percent' });                      // '42%' on en, '42 %' on sv
format.number(5, { style: 'unit', unit: 'kilometer' });         // '5 km' on en, '5 km' on sv
```

## format.number

```ts
format.number(value: number, options?: FormatNumberOptions): string
```

`FormatNumberOptions` is a discriminated union on `style`. Pick a branch and the compiler unlocks the matching fields.

### Decimal — default

The default branch. No required fields. Accepts every [`Intl.NumberFormatOptions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options) that is not currency- or unit-specific.

```ts
format.number(1_234_567);                                       // '1,234,567' on en
format.number(0.1234, { maximumFractionDigits: 2 });            // '0.12' on en
format.number(1234, { notation: 'compact' });                   // '1.2K' on en
format.number(1234, { useGrouping: false });                    // '1234' on en
```

### Currency

`style: 'currency'` requires the `currency` field — yapyak lifts `Intl`'s runtime requirement to compile time.

```ts
format.number(1500, { style: 'currency', currency: 'EUR' });
// '€1,500.00' on en, '1 500,00 €' on sv

format.number(1500, { style: 'currency', currency: 'SEK' });
// 'SEK 1,500.00' on en, '1 500,00 kr' on sv

format.number(1500, {
  style: 'currency',
  currency: 'EUR',
  currencyDisplay: 'code',
});
// 'EUR 1,500.00' on en
```

The `currency` field accepts the [`Currency`](#the-currency-type) literal union (162 ISO 4217 codes from the host runtime's `Intl.supportedValuesOf('currency')`) plus any string for runtime data.

```ts
const fromDb: string = order.currency_code;
format.number(order.amount, { style: 'currency', currency: fromDb });
```

#### Unsupported currency codes

A code unsupported by the host `Intl` does not throw — yapyak warns once per `(locale, code)` pair and renders `'<value> <code>'`:

```ts
format.number(1500, { style: 'currency', currency: 'XYZ' });
// '1,500 XYZ' on en — graceful fallback, console warn fires once
```

Renders never unmount. In production (`NODE_ENV=production`) the warn is silent — bundlers eliminate it as dead code.

### Percent

The input is a fraction, not a percentage — `0.42` becomes `'42%'`, not `'0.42%'`.

```ts
format.number(0.42, { style: 'percent' });                          // '42%' on en
format.number(0.4253, {
  style: 'percent',
  maximumFractionDigits: 1,
});                                                                  // '42.5%' on en
format.number(-0.05, {
  style: 'percent',
  signDisplay: 'always',
});                                                                  // '-5%' on en
```

`currency*` options are a compile error in this branch — they have no meaning for percent.

### Unit

`style: 'unit'` requires the `unit` field.

```ts
format.number(5, { style: 'unit', unit: 'kilometer' });
// '5 km' on en, '5 km' on sv

format.number(5, {
  style: 'unit',
  unit: 'kilometer',
  unitDisplay: 'long',
});
// '5 kilometers' on en, '5 kilometer' on sv
```

To join several values into one string (`'1 km, 2 m, and 3 cm'`), see [format.list with `type: 'unit'`](./lists.md#type).

## The Currency type

`Currency` is the union of every ISO 4217 code the host runtime's `Intl` supports — about 162 entries.

```ts
import type { Currency } from 'yapyak';

function setPrice(amount: number, currency: Currency) {
  return format.number(amount, { style: 'currency', currency });
}

setPrice(199, 'USD');   // ✓
setPrice(199, 'XYZ');   // ✗ compile error — not in ISO 4217
```

Use it as a parameter type, a record key, or a variable annotation.

```ts
const defaultCurrency: Currency = 'SEK';

const prices: Record<Currency, number> = {
  SEK: 199,
  USD: 19,
  EUR: 18,
};
```

For runtime narrowing, see [`isCurrency`](#iscurrency).

## isCurrency

Narrows an arbitrary `string` to [`Currency`](#the-currency-type) when the host runtime recognizes it.

```ts
import { format, isCurrency } from 'yapyak';

function handlePayment(input: string) {
  if (!isCurrency(input)) {
    throw new Error(`Invalid currency: ${input}`);
  }
  return format.number(199, { style: 'currency', currency: input });
}
```

The check reads `Intl.supportedValuesOf('currency')` once on first call and caches it. The check is case-sensitive — uppercase only.

```ts
isCurrency('USD');     // true
isCurrency('usd');     // false
isCurrency('XYZ');     // false
```
