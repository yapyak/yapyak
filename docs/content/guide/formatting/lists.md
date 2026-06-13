---
title: Lists
order: 4
---

Joining strings the way the locale would. `'a, b, and c'` on `en`, `'a, b och c'` on `sv`. One [`Intl.ListFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat) per `(locale, options)` combination, cached until the process restarts.

```ts
import { format } from 'yapyak';

format.list(['apples', 'pears', 'oranges']);
// 'apples, pears, and oranges' on en
// 'apples, pears och oranges' on sv
```

## format.list

Accepts any iterable — arrays, sets, generators. Items must already be strings; yapyak does not coerce or format individual items. `FormatListOptions` is [`Intl.ListFormatOptions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat#options) minus `localeMatcher`.

```ts
format.list(items: Iterable<string>, options?: FormatListOptions): string
```

```ts
const fruits = ['apples', 'pears'];
format.list(fruits);                                           // 'apples and pears' on en

const set = new Set(['a', 'b', 'c']);
format.list(set);                                              // 'a, b, and c' on en
```

## Type

The `type` option controls which separator words are used.

- `'conjunction'` (default) — *and*: `'a, b, and c'`
- `'disjunction'` — *or*: `'a, b, or c'`
- `'unit'` — for unit-of-measure lists: `'1 km, 2 m, 3 cm'`

```ts
format.list(['a', 'b', 'c'], { type: 'conjunction' });         // 'a, b, and c' on en
format.list(['a', 'b', 'c'], { type: 'disjunction' });         // 'a, b, or c' on en
format.list(['1 km', '2 m', '3 cm'], { type: 'unit' });        // '1 km, 2 m, 3 cm' on en
```

::: info
`type: 'unit'` joins a list of pre-rendered unit values. To format a single number with a unit, see [format.number with style 'unit'](./numbers.md#units).
:::

## Style

The `style` option controls the verbosity of the separators.

- `'long'` (default) — full words: `'a, b, and c'` on en
- `'short'` — abbreviated where the locale provides one: `'a, b, & c'` on en
- `'narrow'` — even shorter, often just punctuation: `'a, b, c'` on en

```ts
format.list(['a', 'b', 'c']);                                  // 'a, b, and c' on en
format.list(['a', 'b', 'c'], { style: 'short' });              // 'a, b, & c' on en
format.list(['a', 'b', 'c'], { style: 'narrow' });             // 'a, b, c' on en
```

Behavior varies per locale. Swedish renders narrow close to the short form.
