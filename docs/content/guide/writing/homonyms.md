---
title: Homonyms
order: 7
---

Sometimes two `t()` calls use the same English source but mean different things. "Open" is the most common — a button that performs an action, and a status that describes a state. In English they're the same word; in many other languages they aren't.

```ts
t('Open');  // a button: "Öppna" in Swedish
t('Open');  // a status: "Öppen" in Swedish
```

With the simple form, yapyak has no way to tell those two calls apart. They share a locale-file entry, and only one Swedish translation gets stored. `t.as(context, source)` is how you split them.

```ts
t.as('action', 'Open');   // "Öppna"
t.as('status', 'Open');   // "Öppen"
```

The first argument is a short context label — your description of which sense you mean. It's not shown to the user. It exists to give translators (human or model) enough signal to render the right word, and to keep the two versions stored separately in your locale file.

## What ends up in the locale file

A homonym source nests its translations under the context name:

```json [locales/sv.json]
{
  "src/components/dialog.tsx": {
    "Open": {
      "action": "Öppna",
      "status": "Öppen"
    }
  }
}
```

The compiler reads the JSON shape to decide whether a call is plain or contextualized. The same source can't be used both ways inside a single file — pick one form per call site or split the calls into separate files. If you mix them, yapyak raises a [`YAP0018` diagnostic](/guide/advanced/diagnostics) on save.

## What the context string can be

Anything that helps a translator (or model) distinguish the meaning. Short labels work well: `action`, `status`, `noun`, `verb`, `imperative`, `count`, `currency`. A model translating the message sees the context alongside the source, plus the [call-site context](/guide/translators/overview#context) yapyak forwards by default, and uses both to choose the right word.

Keep contexts short and stable. Treating them like keys in a dictionary (`'open-action-button-primary'`) defeats the purpose — you've reinvented the synthetic-key habit yapyak was designed to avoid. A bare adjective or noun is usually all the model needs.

The context has to be a literal string at the call site (`t.as('action', 'Open')`), not a variable. The compiler reads it directly to scope the translation, so dynamic contexts can't be extracted.

## With params

`t.as()` supports the same placeholder shape as plain [`t()`](/guide/writing/params):

```ts
t.as('headline', 'Welcome, {name}', { name: 'Ada' });
```

The params and rich-text behavior are identical. The context label only changes which translation slot the call lands in.

## Combining with `t.in()`

A homonym can be rendered for a specific locale by chaining `.in()`:

```ts
t.as('action').in('sv', 'Open');     // Swedish action sense
t.in('sv').as('action', 'Open');     // same thing, other order
```

See [Overrides](/guide/writing/overrides) for what `t.in()` does on its own.
