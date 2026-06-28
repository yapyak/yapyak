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

Voice is the biggest knob for shaping tone. Vague gives bland; specific gives character.

## Keep it short

A sentence or two. Long voices confuse the model; it starts weighing the voice instruction against the meaning of each string.

## When you change it

A voice change only affects new translations. Existing translations stay as written. Run `yapyak translate --force` to re-translate everything with the new voice, or `yapyak retranslate "<source>"` to redo one source string. See [Coverage](/guide/translating/coverage).

