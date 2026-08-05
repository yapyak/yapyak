---
title: Homonyms
order: 7
---

Two `t()` calls can share the same English source while meaning different things. "Open" is the canonical example: the same English word for a button that performs an action and for a status that describes a state. Many languages need different translations for each — `'Öppna'` for the button, `'Öppen'` for the status.

```ts
t('Open');
t('Open');
```

With the simple form, yapyak has no way to tell those two calls apart. They share a locale-file entry, and only one Swedish translation gets stored. [`t.as(context, source)`](/reference/yapyak/t.as) is how you split them.

```ts
t.as('action', 'Open');
// output: 'Öppna'

t.as('status', 'Open');
// output: 'Öppen'
```

The first argument is a short context label — your description of which sense you mean. It's not shown to the user. It gives translators (human or model) the signal they need to pick the right word. It also stores the two versions separately in your locale file.

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

The compiler reads the JSON shape to decide whether a call is plain or contextualized. The same source can't be used both ways inside a single file. Pick one form per call or split the calls into separate files. If you mix them, yapyak raises a [`YAP0018` diagnostic](/reference/diagnostics/YAP0018) on save.

## What the context string can be

Anything that helps a translator (or model) distinguish the meaning. Short labels work well: `action`, `status`, `noun`, `verb`, `imperative`, `count`, `currency`. A model translating the message sees the context alongside the source, plus the [call-site context](/guide/translating/context) yapyak forwards by default, and uses both to choose the right word.

Keep contexts short and stable. Long keys like `'open-action-button-primary'` are synthetic identifiers — exactly what `t()` removes the need for. A bare adjective or noun is usually all the model needs.

The context has to be a literal string at the call site (`t.as('action', 'Open')`), not a variable. The compiler reads it directly to scope the translation, so dynamic contexts can't be extracted. A non-literal context raises [`YAP0017`](/reference/diagnostics/YAP0017).

To force a specific locale on a homonym, chain `.in()`. See [Overrides](/guide/writing/overrides#combining-with-as).
