---
title: Examples
order: 6
---

`examples` is the number of your existing translations yapyak sends along with each request as in-context style references. The model uses them to match your project's voice without needing it spelled out.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  examples: 5,
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })
});
```

Each translation request carries N source-translation pairs the model can imitate.

## The default

`5`. Or `0` when the translator's [`context`](/guide/translating/context) is `'none'`, since `'none'` means no per-item context goes out at all.

## Why it helps

Voice instructs in the abstract; examples show the result. A few well-chosen pairs anchor tone consistency far more concretely than a sentence of guidance. The model sees the registered character of your existing translations and produces output in the same character.

## When to raise it

- Translations are drifting in tone between requests despite a clear voice.
- The model is making different formality choices for similar messages.
- You've hand-edited translations into a specific style and want the model to follow.

## When to lower it

- Token cost or latency matters and tone is consistent enough already.
- Your existing translations are inconsistent and would mislead more than guide.
- Privacy: every example is part of the prompt sent to the provider. With `context: 'none'`, examples default to `0` for the same reason.

## How yapyak picks which examples

yapyak picks N translations from elsewhere in your project, biased toward entries that share locale and surface area with the current batch. The selection is deterministic — same input, same examples — so two runs of the same batch produce the same prompt.
