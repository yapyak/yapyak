---
title: Override
order: 5
---

Forces a locale for one call or for the rest of the module's life. `format.in('sv')` returns a [`Format`](./overview.md#the-format-type) that behaves exactly like the unscoped one — same eight methods — except every result comes out in Swedish regardless of who is looking.

```ts
import { format } from 'yapyak';

format.in('sv').number(1234.5);          // '1 234,5' even if the active locale is 'en'
format.in('en').currency(199, 'EUR');    // '€199.00' even if the active locale is 'sv'
```

## format.in

Returns a `Format` whose methods always render in `locale`. The argument is any BCP 47 language tag accepted by the underlying `Intl` constructors (`'sv'`, `'en-US'`, `'pt-BR'`).

```ts
format.in(locale: string): Format
```

## Reusing

For a single call, chain the method directly. For many calls, capture the scoped `Format` once and reuse it.

```ts
format.in('sv').number(1234.5);          // one-off

const sv = format.in('sv');              // bound once
sv.number(1234.5);                       // '1 234,5'
sv.currency(199, 'SEK');                 // '199,00 kr'
sv.date(new Date());                     // '12 nov. 2025'
```

The captured value has no expiration. It stays valid for the lifetime of the module.

## Chaining

Calling `.in()` on an already-scoped `Format` replaces the locale. The last call wins, and captured values stay independent of each other.

```ts
format.in('sv').in('en').number(1234.5); // '1,234.5' — en wins

const sv = format.in('sv');
const en = sv.in('en');

sv.number(1234.5);                       // '1 234,5' — still sv
en.number(1234.5);                       // '1,234.5'
```

The translation-side equivalent is [t.in()](/guide/translations/override).
