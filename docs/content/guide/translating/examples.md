---
title: Examples
order: 6
---

`examples` is a translator option: the number of your existing translations yapyak sends along with each request as in-context style references. The model uses them to match your project's voice without needing it spelled out.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    examples: 5
  })
});
```

Each translation request carries N source-translation pairs the model can imitate.

## Default

`5`. Or `0` if the translator's [`context`](/guide/translating/context) is `'none'`, since `'none'` means no per-item context goes out at all. Set `examples: 0` to disable in-context examples explicitly.

{% callout variant="warning" %}
`context: 'none'` drops examples from the request regardless of what you set `examples` to. The level overrides the count.
{% /callout %}

## Why it helps

Voice instructs the model. Examples demonstrate. A handful of source-translation pairs shape the output better than a brief written description. The model reads the tone of your existing translations and matches it.

## Tuning

Raise `examples` if translations drift in tone between requests, if the model is making different formality choices for similar messages, or if you've hand-edited translations into a specific style and want the model to follow.

Lower `examples` if token cost or latency matters and tone is consistent enough already, if your existing translations are inconsistent and would mislead more than guide, or for privacy — every example is part of the prompt sent to the provider.

## Selection

yapyak scores candidates by word-level similarity to each source string, from the same target locale. Ties break by same-file proximity, then alphabetically. The same input always picks the same examples.
