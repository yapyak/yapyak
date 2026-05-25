---
title: Introduction
order: 1
---

yapyak generates translations on save. You write a string in your code, save the file, and every locale file in your repo updates.

## Write a string

```tsx
import { $t } from 'yapyak';

export function SaveButton() {
  return <button>{$t('Save changes')}</button>;
}
```

That's the whole API. The English you write is the key.

## Save the file

When the file saves, yapyak finds the `$t()` call, reads the surrounding code as context, and writes entries to every locale file in your project.

If a [translator](/guide/translators/introduction) is configured, the entries get filled in. If not, they land as empty stubs you can fill by hand. The browser updates through HMR either way.

After save, `locales/sv.json` looks something like this:

```json
{
  "src/components/save-button.tsx": {
    "Save changes": "Spara ändringar"
  }
}
```

Entries are keyed by file path, then by source string. The same string in two components stays separate — "Save" in a button and "Save" in a menu can translate differently if they need to.

## Add a locale

Adding a language is creating a file:

```bash
npx yapyak add ja
# or
pnpm yapyak add ja
```

Or just create `locales/ja.json` by hand. yapyak picks it up on next save and generates (or stubs) the Japanese translations alongside the rest.

## Your AI key, your locale files

yapyak has no business model. It's a library on npm, MIT-licensed, that never sees your tokens. Bring your own AI — Anthropic, OpenAI, Gemini, Ollama, or your own translator in 30 lines. Or skip AI entirely and fill the JSON by hand.

## Where to go next

- [Installation](/guide/installation) — install the package, configure the Vite plugin, add your first locale.
- [How it works](/guide/how-it-works) — what happens on save, how the AI loop is orchestrated, how the runtime resolves locale.
- [Translations](/guide/translations) — the $t() macro, params, plurals, forced locale, per-file scoping.
- [Locales](/guide/locales) — adding locales, persistence, switching at runtime.
