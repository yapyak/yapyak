---
title: Custom
order: 6
---


Anything that can return translated strings can be a yapyak translator. Use `createTranslator` to build one — it handles batching, validation, and error handling so you only have to wire the LLM call.

```ts
import { createTranslator } from 'yapyak';

const myTranslator = createTranslator({
  async translate({ items, sourceLocale, targetLocale, signal }) {
    // Your code here. Return string[].
    return items.map((item) => item.source);
  },
});

yapyak({ translator: myTranslator });
```

## When to build one

| Provider | Use |
| --- | --- |
| AWS Bedrock | Custom — uses AWS SDK / SigV4 auth |
| Vertex AI (Google enterprise) | Custom — uses GCP IAM / ADC auth |
| Azure OpenAI | OpenAI translator with `endpoint` override (Azure exposes OpenAI-compatible API) |
| Cohere | Custom — has its own API shape |
| Internal company AI service | Custom |
| Local LM Studio / LocalAI | Custom — or OpenAI translator if they expose OpenAI-compatible API |
| HuggingFace Inference API | Custom |
| Your own fine-tuned model | Custom |
| Rules-based / dictionary lookup | Custom (no AI needed) |

For OpenAI-compatible providers (Groq, DeepSeek, Mistral, OpenRouter, Vercel AI Gateway), prefer the [OpenAI translator with `endpoint`](/guide/translators/openai#use-as-a-universal-compatibility-layer) — no custom translator needed.

## The `createTranslator` API

```ts
interface CreateTranslatorOptions {
  batchSize?: number;
  context?: 'none' | 'minimal' | 'rich';
  translate: (params: TranslateParams) => string[] | Promise<string[]>;
}

interface TranslateParams {
  items: Array<{
    source: string;
    component?: string;
    element?: string;
    snippet?: string;
  }>;
  sourceLocale: string;
  targetLocale: string;
  signal?: AbortSignal;
}
```

You provide `translate`. The factory handles the rest:

1. Splits a large request set into chunks of `batchSize` (default 10)
2. For each chunk, calls your `translate({ items, ... })` function
3. Validates your return value:
   - Must be an array
   - Length must equal `items.length`
   - Every entry must be a `string`
   - Throws a descriptive error otherwise
4. Trims whitespace per entry
5. Merges chunks back into a single `string[]` result

## Strict return contract

`translate` must return `string[]` (or `Promise<string[]>`):

| Return | Behavior |
| --- | --- |
| `['Spara', 'Avbryt']` for 2-item input | ✓ Accepted |
| `['Spara']` for 2-item input | ✗ `Error: translate returned 1 items, expected 2` |
| `[{ translation: 'Spara' }]` | ✗ `Error: translate item 0 was not a string: {...}` |
| `null` / `undefined` | ✗ `Error: translate must return an array, got object` |
| `Promise<string[]>` | ✓ Awaited, then validated |

No automatic coercion. If your AI returns weird shapes, normalize them inside `translate` before returning. The factory expects clean output.

## Example: factory pattern with options

For a reusable translator with configurable options:

```ts
import { createTranslator } from 'yapyak';

interface MyLLMOptions {
  endpoint: string;
  apiKey: string;
  model: string;
  voice?: string;
  temperature?: number;
}

export function myLLM(opts: MyLLMOptions) {
  return createTranslator({
    batchSize: 10,
    async translate({ items, sourceLocale, targetLocale, signal }) {
      const response = await fetch(opts.endpoint, {
        method: 'POST',
        signal,
        headers: {
          authorization: `Bearer ${opts.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: opts.model,
          temperature: opts.temperature ?? 0.2,
          system: buildPrompt(sourceLocale, targetLocale, opts.voice),
          input: items,
        }),
      });

      if (!response.ok) {
        throw new Error(`myLLM: ${response.status} ${await response.text()}`);
      }

      const data = await response.json();
      return data.translations;
    },
  });
}
```

Then use it:

```ts
yapyak({
  translator: myLLM({
    endpoint: 'https://my-llm.example.com/translate',
    apiKey: process.env.MY_LLM_KEY!,
    model: 'my-model-v3',
    voice: 'Casual',
  }),
})
```

## Example: rules-based translator (no AI)

For testing, pseudo-locales, or specific deterministic transforms:

```ts
import { createTranslator } from 'yapyak';

export const pseudoLocale = createTranslator({
  translate({ items, targetLocale }) {
    if (targetLocale !== 'pseudo') {
      throw new Error('pseudoLocale only supports the "pseudo" target');
    }
    return items.map((item) =>
      `⟦${item.source.replace(/[aeiou]/g, (c) => `${c}${c}`)}⟧`,
    );
  },
});
```

This translator is *synchronous* — `translate` returns `string[]` directly, not a Promise. The factory handles both forms.

Use case: catch hard-coded strings (without `t()` wrapping) by setting up a pseudo-locale that mangles every translated string. Anything still showing real English in your UI when running in pseudo mode is a bug.

## Errors and retries

If your `translate` throws, yapyak handles it gracefully — failed strings stay missing in `locales/*.json` and retry on the next save. See [When things go wrong](/guide/translators#when-things-go-wrong) for the full failure model.

For retries inside your own translator (e.g., rate-limited APIs), wrap the HTTP call yourself. The shipped translators use a built-in `fetchWithRetry` with exponential backoff on 408/429/5xx — you can replicate that pattern or use any retry library.

## Testing your translator

```ts
import { describe, it, expect } from 'vitest';
import { myLLM } from './my-translator';

const translator = myLLM({ apiKey: 'test', model: 'mock', endpoint: '…' });

it('translates a batch', async () => {
  const result = await translator.batch!([
    { fileId: 'src/a.tsx', source: 'Save', sourceLocale: 'en', targetLocale: 'sv' },
    { fileId: 'src/a.tsx', source: 'Cancel', sourceLocale: 'en', targetLocale: 'sv' },
  ]);
  expect(result).toEqual(['Spara', 'Avbryt']);
});
```

The shipped translators have similar tests — open the source under `src/translator/` for examples.

