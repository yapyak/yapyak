---
title: Introduction
order: 1
---

yapyak generates translations on save. You write a string in your code, save the file, and every locale in your repo updates.

```tsx
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

That's the API. The English you write IS the key, the line above is the entire surface.

## The English IS the key

What Tailwind did for class names, yapyak does for i18n keys. There's no catalog of identifiers to invent and maintain. The source string is the contract.

TypeScript reads the placeholders straight off the literal. Forget a `{count}` placeholder in `t('You have {count} items')` and the compiler stops you before your tech lead does. Same for typos in param names, wrong value types for ICU patterns, dynamic strings that can't be statically extracted. Eight diagnostic classes, all caught at compile time.

Per-file scoping means the same English in two components stays separate. "Save" in a button can translate differently from "Save" in a menu header without anyone choosing a key prefix.

## Inlined at build

At build, the Vite plugin rewrites every `t('Save changes')` call into a direct lookup with the variants inlined as a const:

```tsx
_pick({ en: 'Save changes', sv: 'Spara ändringar', es: 'Guardar cambios' })
```

No catalog gets fetched on first paint. Each Vite chunk ships only the variants it actually uses, so bundle size scales with what each route renders, not the strings you wrote three years ago.

Without any locales configured, the `_pick()` call disappears entirely. Adopting yapyak before you have translations is free.

## Save it, see it live

Hit save with one new string. Before you alt-tab back to the browser, it's been translated to every locale you've configured. Bootstrapping a new locale of 1000 strings against 9 targets takes under a minute. Single-string saves are around a second, invisible.

When a save adds more than 20 new strings at once, yapyak writes empty stubs and stays out of the way. Your save is never hostage to a runaway batch. Paste-bombs go through the CLI like everyone else, with a live progress bar.

## Your AI, your repo

yapyak has no business model. It's an npm package on MIT. No portal, no seats, no "Contact sales", no per-string metering. Bring the AI you want:

- **Anthropic** (Claude)
- **OpenAI** (GPT)
- **Gemini**
- **Ollama** (local, no API)
- **Custom** (30 lines of TypeScript)

yapyak never sees your tokens. Other i18n services mark up your AI bill 5x. yapyak doesn't bill at all.

## Where to go next

- [How it works](/guide/how-it-works): the save pipeline, rename detection, AI context, compile mechanics
- [Installation](/guide/installation): install, configure, your first locale
- [Translations](/guide/translations): params, plurals, forced locale, per-file scoping
- [Locales](/guide/locales): persistence, runtime switching, detection
- [Translators](/guide/translators/introduction): pick a provider or build your own
- [Adapters](/guide/adapters/introduction): SSR setup for TanStack Start, SvelteKit, Astro, React Router
