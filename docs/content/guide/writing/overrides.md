---
title: Overrides
order: 6
---

Most of the time, `t()` renders the active locale. There are a few moments where you want to lock a specific call to one language regardless of who's reading — a locale-preview pane in your CMS, a server-side email rendered for a recipient whose preference isn't the request's locale, a debugging tool that shows every language side-by-side.

For those, `t.in(locale, source)` forces a single locale on a single call.

```ts
t.in('sv', 'Welcome back');
```

This always returns the Swedish translation regardless of the active locale. The signature mirrors `t()` — placeholder parameters, rich-text tags, and ICU sub-formats all work the same. The only difference is that the locale is fixed.

## With parameters

Placeholders behave exactly as in [`t()`](/guide/writing/params):

```ts
t.in('sv', 'Hi {name}, you have {count, plural, one {# message} other {# messages}}', {
  count: 3,
  name: 'Ada',
});
```

TypeScript validates the parameters against the source string, and the locale argument is typed against your [`Locale`](/guide/locale/overview) union — pass a locale you haven't added and you get a compile-time error.

## Combining with `.as()`

`t.in()` and `t.as()` chain in either order. The result is the same — a translation for the named locale, disambiguated by the given context:

```ts
t.in('sv').as('action', 'Open');     // chain: locale first

t.as('action').in('sv', 'Open');     // chain: context first
```

You'd use this when you need both at once — say, rendering the Swedish "Open" button label inside an admin tool that also runs in English.

See [Homonyms](/guide/writing/homonyms) for what `t.as()` does on its own.

## The chain is inline-only

`t.in('sv')` and `t.as('action')` return a chain object you complete in the same expression. You can't store the chain in a variable and reuse it:

{% diagnostics %}
const swedish = t.in('sv');           // error: YAP0020 captured chain
swedish('Welcome');                   // no
{% /diagnostics %}

The compiler needs to see the full call (`t.in('sv', 'Welcome')`) in one place to extract the source string. A stored chain would hide the source from the parser. Use the inline form, repeat the prefix if needed.

## When not to use it

`t.in()` is a sharp tool. Reach for it when you genuinely need to render in a non-active locale: a side-by-side comparison, a server-rendered email, an admin-only preview. For everything else, the active locale is what you want — let the regular `t()` and your locale-switcher handle it.

Common misuses to avoid:

- **As a per-component override.** If a single screen always renders in one language, set the locale at navigation time instead of pinning every call.
- **For data-driven user preferences.** A user's preferred locale should drive the active locale (through [persistence](/guide/locale/persistence) or a server middleware), not appear as an argument on every `t()`.
- **Inside a loop over locales.** `t.in()` lets you do this, but if you're rendering the same message in every language, you're probably building a translation tool — see whether reading the locale files directly fits better.
