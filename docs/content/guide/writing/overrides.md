---
title: Overrides
order: 6
---

[`t.in(locale, source)`](/reference/yapyak/t.in) forces a single locale on one call, regardless of the active locale.

```ts
t.in('sv', 'Welcome back');
```

This always returns the Swedish translation regardless of the active locale. The signature mirrors `t()`. Placeholder parameters, rich-text tags, and ICU sub-formats all work the same. The locale argument is typed against your [`Locale`](/reference/yapyak/Locale) union, so an unknown code is a compile-time error.

## Chaining with as

`t.in()` and `t.as()` chain in either order. Locale-first reads `t.in('sv').as('action', 'Open')`; context-first reads `t.as('action').in('sv', 'Open')`. The result is the same — a translation for the named locale, disambiguated by the given context.

```ts
t.in('sv').as('action', 'Open');

t.as('action').in('sv', 'Open');
```

Use both when you need a specific locale and a homonym disambiguation in the same call — for example, the Swedish "Open" button label inside an admin tool that also runs in English.

See [Homonyms](/guide/writing/homonyms) for what `t.as()` does on its own.

## The chain is inline-only

`t.in('sv')` and `t.as('action')` return a chain object you complete in the same expression. You can't store the chain in a variable and reuse it:

{% diagnostics %}
const swedish = t.in('sv');           // error: YAP0020 captured chain
swedish.as('action', 'Welcome');      // no
{% /diagnostics %}

The compiler needs to see the full call (`t.in('sv', 'Welcome')`) in one place to extract the source string. A stored chain would hide the source from the parser. Use the inline form, repeat the prefix if needed.

