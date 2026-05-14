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

## Example: Ollama from scratch

What the shipped `ollama()` translator looks like internally — a minimal, complete custom translator:

```ts
import { createTranslator } from 'yapyak';

export function ollama(opts: { model?: string; voice?: string } = {}) {
  const model = opts.model ?? 'llama3.1';

  return createTranslator({
    batchSize: 10,
    async translate({ items, sourceLocale, targetLocale, signal }) {
      const system = `Translate each item.source from ${sourceLocale} to ${targetLocale}.${
        opts.voice ? `\nVoice: ${opts.voice}` : ''
      }\nReturn a JSON array of strings, same length, same order.`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        signal,
        body: JSON.stringify({
          model,
          system,
          prompt: JSON.stringify(items),
          format: 'json',
          stream: false,
        }),
      });
      const data = await response.json();
      return JSON.parse(data.response);
    },
  });
}
```

~25 lines for a complete translator. Use as a template.

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

## Available helpers

For convenience, the shared system-prompt builder used by the shipped translators is exported:

```ts
import { createTranslator } from 'yapyak';
import { buildSystem } from 'yapyak/translator/prompt';   // (if you publish this)

// inside your translate:
const system = buildSystem(opts, sourceLocale, targetLocale);
```

::: tip
This helper isn't currently a public export. If you'd find it useful for your own translator, open an issue and we'll consider stabilizing it.
:::

## Errors and retries

If your `translate` throws:

- The plugin/CLI logs the error and the failed batch
- Other batches continue (don't take down the whole translation pipeline)
- Failed entries stay as empty stubs — retried on next save or next `npx yapyak translate`

If you want retries inside your translator (e.g., for rate-limited APIs), use yapyak's shared retry helper or roll your own. The shipped translators use a built-in `fetchWithRetry` with exponential backoff (250ms, 500ms, 1s, 2s, 4s, 8s) on 408/429/5xx.

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

The shipped translators have similar tests — open the source under `packages/yapyak/src/translators/` for examples.

## Publish as a package

If you've built a translator worth sharing, publish it as an npm package:

```ts
// my-yapyak-translator/src/index.ts
import { createTranslator, type Translator } from 'yapyak';

export interface MyOptions { /* ... */ }
export function myProvider(opts: MyOptions): Translator { /* ... */ }
```

Users install it alongside yapyak:

```bash
npm install yapyak my-yapyak-translator
# or
pnpm add yapyak my-yapyak-translator
```

```ts
import { myProvider } from 'my-yapyak-translator';

yapyak({
  translator: myProvider({ /* ... */ }),
})
```
