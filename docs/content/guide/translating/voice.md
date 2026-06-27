---
title: Voice
order: 4
---

`voice` is a short sentence describing how translations should read. yapyak passes it to the model as system-prompt guidance for every request.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    voice: 'Concise and friendly'
  })
});
```

The model reads it on every call and shapes its output accordingly.

## What a good voice reads like

A short, specific characterization of the audience and tone you want:

```ts
voice: 'Concise and friendly';
voice: 'Formal legal language';
voice: 'A casual SaaS marketing tone';
voice: 'Like a senior engineer writing release notes';
```

Voice is the single biggest knob for shaping output. A vague voice gives bland translations. A specific one gives the registered character.

## Keep it short

A sentence or two. Long voices confuse rather than clarify; the model starts trading off between the voice instruction and the meaning of each string.

## When you change it

A voice change only affects new translations. Existing translations stay as written. Run `yapyak translate --force` to re-translate everything with the new voice, or `yapyak retranslate "<source>"` to redo one source string. See [Coverage](/guide/translating/coverage).

## Voice vs glossary

Voice shapes how the model phrases things. [Glossary](/guide/translating/glossary) pins specific terms the model is not allowed to phrase differently. Use voice for tone, glossary for vocabulary.
