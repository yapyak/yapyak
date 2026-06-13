---
title: ICU
order: 3
---

yapyak uses ICU MessageFormat for placeholders, plurals, selections, and formatted numbers, dates, and times. Placeholder types are inferred from the source string at compile time, then rendered through `Intl` at runtime.

## Placeholders

A simple placeholder is `{name}`:

```ts
t('Hi {name}', { name: 'Alex' });
```

The inferred type for the param is `string | number`. Undefined values render as an empty string.

## Plural

`{count, plural, ...}` selects a branch based on the value:

```ts
t('You have {count, plural, one {# item} other {# items}}', { count });
```

Required branch: `other`. Other branches (`zero`, `one`, `two`, `few`, `many`) are filled in only when the active locale uses them. The `#` token is replaced with the locale-formatted count.

Exact matches with `=N` take precedence over plural categories:

```ts
t('{count, plural, =0 {No items} one {# item} other {# items}}', { count });
```

The inferred type for the param is `number`.

## Selectordinal

`{count, selectordinal, ...}` works like plural but uses ordinal rules:

```ts
t('{rank, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}', { rank });
```

Same required `other` branch. Same `#` substitution. Same `number` param type.

## Select

`{key, select, ...}` selects a branch by exact match:

```ts
t('{gender, select, male {He} female {She} other {They}} replied', { gender });
```

Required branch: `other`. With `other` present, the inferred param type is the union of the listed branch keys plus `string`, so any other value falls through to `other`.

Without `other` the message is YPK202.

## Numbers

`{value, number, style}` formats a number through `Intl.NumberFormat`:

```ts
t('{price, number, currency EUR}', { price: 1299 });
t('{rate, number, percent}', { rate: 0.85 });
t('{count, number, integer}', { count: 1500 });
```

Supported styles: `decimal` (default), `integer`, `percent`, `currency CODE` (ISO 4217). The param type is `number`.

The `CODE` after `currency` is three uppercase ASCII letters. Lowercase, two-letter, or longer codes fail parse with [YPK201](./diagnostics#ypk201).

## Dates and times

`{value, date, style}` and `{value, time, style}` format through `Intl.DateTimeFormat`:

```ts
t('Saved on {date, date, long}', { date: new Date() });
t('At {time, time, short}', { time: timestamp });
```

Supported styles: `full`, `long`, `medium`, `short`. The default if omitted is `medium`. The param type is `Date | number`, where a number is interpreted as Unix milliseconds.

## Nesting

ICU placeholders can be nested inside `plural`, `selectordinal`, and `select` branches:

```ts
t(
  '{count, plural, one {# from {author}} other {# from {author}}}',
  { count, author },
);
```

All placeholders are extracted to a single flat params type at the top level. There is no nesting depth limit.

## Limits

Some ICU features are not supported by the compiler. Each one emits YPK203 at parse time.

| Feature | Workaround |
|---|---|
| `offset:N` in plural | Compute the offset value in JS and pass the adjusted number |
| Date/time skeletons (`::yMMMd`) | Use one of the four named styles |
| Custom date/time patterns (`dd/MM/yyyy`) | Use a named style, or format outside `t()` |
| Number skeletons (`::currency/EUR`) | Use `number, currency CODE` |
| Currency without a code (`currency`) | Always specify the ISO code (e.g. `currency USD`) |
| Apostrophe escaping (`'{`, `'#`) | Rephrase to avoid literal `{` or `#` next to placeholders |

## Diagnostics

| Code | Means |
|---|---|
| [YPK201](./diagnostics#ypk201) | Malformed ICU syntax |
| [YPK202](./diagnostics#ypk202) | Missing required `other` branch |
| [YPK203](./diagnostics#ypk203) | Unsupported ICU feature |
