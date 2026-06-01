---
title: Numbers
order: 2
description: format.number, format.currency, and format.percent — Intl.NumberFormat with yapyak's locale resolution.
---

Three methods, one [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) underneath. `currency` and `percent` lock the `style` you would otherwise set yourself; `number` passes options through to `Intl` and gets out of the way.

```ts
import { format } from 'yapyak';

format.number(1234.5);             // '1,234.5' on en, '1 234,5' on sv
format.currency(199, 'EUR');       // '€199.00' on en, '199,00 €' on sv
format.percent(0.42);              // '42%' on en, '42 %' on sv
```

## format.number

Formats integers and decimals. Accepts any [`Intl.NumberFormatOptions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options) — yapyak applies no defaults.

```ts
format.number(value: number, options?: Intl.NumberFormatOptions): string
```

```ts
format.number(1234567);                                       // '1,234,567' on en
format.number(0.1234, { maximumFractionDigits: 2 });          // '0.12' on en
format.number(1234, { notation: 'compact' });                 // '1.2K' on en
```

## format.currency

Formats currency amounts. The second argument is the ISO 4217 currency code (`'EUR'`, `'USD'`, `'SEK'`).

```ts
format.currency(value: number, currency: string, options?: Intl.NumberFormatOptions): string
```

::: warning
`format.currency` forces `style: 'currency'` and the provided `currency`, even if you set them in `options`. To format a number without a currency, use `format.number`.
:::

```ts
format.currency(1500, 'EUR');                                 // '€1,500.00' on en
format.currency(1500, 'SEK');                                 // 'SEK 1,500.00' on en, '1 500,00 kr' on sv
format.currency(1500, 'EUR', { currencyDisplay: 'code' });    // 'EUR 1,500.00' on en
```

## format.percent

Formats a fraction as a percentage. The input is a fraction, not a percentage — `0.42` becomes `'42%'`, not `'0.42%'`.

```ts
format.percent(value: number, options?: Intl.NumberFormatOptions): string
```

::: warning
`format.percent` forces `style: 'percent'`, overriding any `style` set in `options`.
:::

```ts
format.percent(0.42);                                         // '42%' on en
format.percent(0.4253, { maximumFractionDigits: 1 });         // '42.5%' on en
```

## Units

yapyak has no dedicated `format.unit` method. Pass `style: 'unit'` to `format.number`:

```ts
format.number(5, { style: 'unit', unit: 'kilometer' });
// '5 km' on en, '5 km' on sv

format.number(5, { style: 'unit', unit: 'kilometer', unitDisplay: 'long' });
// '5 kilometers' on en, '5 kilometer' on sv
```

To join several values into one string (`'1 km, 2 m, and 3 cm'`), see [format.list with type 'unit'](./lists.md#type).
