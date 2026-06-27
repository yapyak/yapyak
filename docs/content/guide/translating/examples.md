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

Set `examples: 0` to disable in-context examples explicitly.

{% callout variant="warning" %}
`context: 'none'` drops examples from the request regardless of what you set `examples` to. The level overrides the count.
{% /callout %}

## Why it helps

Voice describes the tone in the abstract. Examples show it. A few well-chosen pairs guide the model more concretely than a sentence of instruction. The model reads the tone of your existing translations and matches it.

## When to raise it

- Translations are drifting in tone between requests despite a clear voice.
- The model is making different formality choices for similar messages.
- You've hand-edited translations into a specific style and want the model to follow.

## When to lower it

- Token cost or latency matters and tone is consistent enough already.
- Your existing translations are inconsistent and would mislead more than guide.
- Privacy: every example is part of the prompt sent to the provider. With `context: 'none'`, examples default to `0` for the same reason.

## How yapyak picks which examples

yapyak only considers translations for the same target locale as the current batch. Candidates are scored by word-level similarity to each source string; ties go to examples from the same source file. The selection is deterministic: the same input produces the same prompt.
