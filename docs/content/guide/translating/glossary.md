---
title: Glossary
order: 5
---

`glossary` is a map of source strings to fixed translations. The model is instructed to use them as-is rather than retranslate.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    glossary: {
      cart: {
        sv: 'kundvagn',
        de: 'Warenkorb'
      },
      checkout: {
        sv: 'kassa',
        de: 'Kasse'
      },
      yapyak: {
        sv: 'yapyak',
        de: 'yapyak'
      }
    }
  })
});
```

The `yapyak` entry pins the product name across locales so it isn't translated.

## When to reach for it

- **Brand names.** The product name, feature names, the names of UI primitives ("Inbox", "Stories", "Stream").
- **Domain vocabulary.** Terms that have a specific meaning in your app and should stay consistent across every message.
- **Disambiguation.** Words the model gets wrong consistently. Pin the right value once.

## The shape

```ts
type Glossary = Record<string, Record<string, string>>;
```

Outer keys are source-language terms (lower-case is conventional). Inner keys are locale codes. Values are the pinned translation.

The glossary goes into the translation request as an instruction: use the pinned value when a term appears in a source string. The model applies it as it translates; yapyak does no string replacement.

## When you change it

A glossary change only affects new translations. To propagate it across existing translations, run `yapyak translate --force` (every entry) or `yapyak retranslate "<source>"` (one source string at a time). See [Coverage](/guide/translating/coverage).
