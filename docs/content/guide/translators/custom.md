---
title: Custom
order: 6
---

## Install

```bash
npm install @yapyak/translator
# or
pnpm add @yapyak/translator
```

## Setup

Anything that can return translated strings can be a yapyak translator. Use `createTranslator` to build one. It handles batching, deduplication across target locales, validation, and error handling so you only have to wire the LLM call.

```ts
import { createTranslator } from '@yapyak/translator';

const myTranslator = createTranslator({
  async translate({ items, sourceLocale, targetLocales, signal }) {
    // Return one object per item with a translation for every locale in `targetLocales`.
    return items.map((item) => {
      const translations = {};
      for (const locale of targetLocales) {
        translations[locale] = item.source;  // your LLM call goes here
      }
      return translations;
    });
  },
});

// In yapyak.config.ts:
// export default defineConfig({ translator: myTranslator });
```

## One request, every target locale

yapyak does not ask the model once per locale. A single request carries every configured target locale, and the model returns one object per source string with a translation for each.

```json
[
  { "sv": "Spara ändringar", "de": "Änderungen speichern", "ja": "変更を保存" },
  { "sv": "Avbryt", "de": "Abbrechen", "ja": "キャンセル" }
]
```

For a project configured with ten locales, that is one round-trip rather than ten. Terminology stays consistent: the same `Save` becomes `Spara` for Swedish and `Speichern` for German in the same response, with both choices visible in the same context window.

Deduplication happens before the request. The same source string appearing across multiple locales collapses into a single item; its target locales merge into the union sent to the model.

## When to build one

| Provider | Use |
| --- | --- |
| AWS Bedrock | Custom (uses AWS SDK / SigV4 auth) |
| Vertex AI (Google enterprise) | Custom (uses GCP IAM / ADC auth) |
| Azure OpenAI | OpenAI translator with `endpoint` override (Azure exposes OpenAI-compatible API) |
| Cohere | Custom (has its own API shape) |
| Internal company AI service | Custom |
| Local LM Studio / LocalAI | Custom, or OpenAI translator if they expose OpenAI-compatible API |
| HuggingFace Inference API | Custom |
| Your own fine-tuned model | Custom |
| Rules-based / dictionary lookup | Custom (no AI needed) |

For OpenAI-compatible providers (Groq, DeepSeek, Mistral, OpenRouter, Vercel AI Gateway), prefer the [OpenAI translator with `endpoint`](/guide/translators/openai#openai-compatible-providers). No custom translator needed.

## The createTranslator API

```ts
interface CreateTranslatorOptions {
  batchSize?: number;
  concurrency?: number;
  context?: 'none' | 'minimal' | 'rich';
  id?: string;
  translate: (params: TranslateBatchRequest) =>
    | LocaleTranslations[]
    | Promise<LocaleTranslations[]>;
}

interface TranslateBatchRequest {
  items: Array<{
    source: string;
    component?: string;
    disambiguation?: string;
    element?: string;
    snippet?: string;
    examples?: Array<{ source: string; translation: string }>;
  }>;
  sourceLocale: string;
  targetLocales: string[];
  signal?: AbortSignal;
}

type LocaleTranslations = Record<string, string>;
```

You provide `translate`. The factory handles the rest:

1. Deduplicates incoming requests by source string and disambiguation across locales.
2. Unions every target locale into a single request to your callback.
3. Splits a large request set into chunks of `batchSize` (default `25`).
4. Runs up to `concurrency` chunks in parallel (default `5`).
5. Validates your return value:
   - Must be an array of `LocaleTranslations` objects.
   - Length must equal `items.length`.
   - Each object should carry a string for every locale in `targetLocales`.
   - Missing locale entries surface as empty strings. yapyak skips writing them and retries on the next save.
6. Trims whitespace per translation.
7. Distributes results back to the original per-locale requests in the same order.

## Strict return contract

`translate` must return `LocaleTranslations[]` (or `Promise<LocaleTranslations[]>`):

| Return for 2-item input, `targetLocales: ['sv', 'de']` | Behavior |
| --- | --- |
| `[{ sv: 'Spara', de: 'Speichern' }, { sv: 'Avbryt', de: 'Abbrechen' }]` | ✓ Accepted |
| `[{ sv: 'Spara' }]` (length mismatch) | ✗ `Error: translate returned 1 item, expected 2` |
| `[{ sv: 'Spara' }, { sv: 'Avbryt' }]` (missing `de`) | ✓ Accepted, `de` left missing and retried |
| `null` / `undefined` | ✗ `Error: translate must return an array, got object` |
| `Promise<LocaleTranslations[]>` | ✓ Awaited, then validated |

No automatic coercion. If your AI returns weird shapes, normalize them inside `translate` before returning. The factory expects clean output.

## Example: factory pattern with options

For a reusable translator with configurable options:

```ts
import { createTranslator } from '@yapyak/translator';

interface MyLLMOptions {
  endpoint: string;
  apiKey: string;
  model: string;
  voice?: string;
  temperature?: number;
}

export function myLLM(opts: MyLLMOptions) {
  return createTranslator({
    id: 'my-llm',
    async translate({ items, sourceLocale, targetLocales, signal }) {
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
          system: buildPrompt(sourceLocale, targetLocales, opts.voice),
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
// yapyak.config.ts
import { defineConfig } from 'yapyak';
import { myLLM } from './my-translator';

export default defineConfig({
  translator: myLLM({
    endpoint: 'https://my-llm.example.com/translate',
    apiKey: process.env.MY_LLM_KEY!,
    model: 'my-model-v3',
    voice: 'Casual',
  }),
});
```

## Example: rules-based translator (no AI)

For testing, pseudo-locales, or specific deterministic transforms:

```ts
import { createTranslator } from '@yapyak/translator';

export const pseudoLocale = createTranslator({
  translate({ items, targetLocales }) {
    return items.map((item) => {
      const mangled = `⟦${item.source.replace(/[aeiou]/g, (c) => `${c}${c}`)}⟧`;
      const result = {};
      for (const locale of targetLocales) {
        result[locale] = mangled;
      }
      return result;
    });
  },
});
```

This translator is *synchronous*. `translate` returns `LocaleTranslations[]` directly, not a Promise. The factory handles both forms.

Use case: catch hard-coded strings (without `t()` wrapping) by setting up a pseudo-locale that mangles every translated string. Anything still showing real English in your UI when running in pseudo mode is a bug.

## Errors and retries

If your `translate` throws, failed strings stay missing in `locales/*.json` and retry on the next save. See [When things go wrong](/guide/translators#when-things-go-wrong) for the full failure model.

For retries inside your own translator (e.g., rate-limited APIs), wrap the HTTP call yourself. The shipped translators use a built-in retry helper with exponential backoff on 408/429/5xx. Replicate that pattern or use any retry library.

## Testing your translator

```ts
import { describe, it, expect } from 'vitest';
import { myLLM } from './my-translator';

const translator = myLLM({ apiKey: 'test', model: 'mock', endpoint: '...' });

it('translates a batch', async () => {
  const result = await translator.batch!([
    { fileId: 'src/a.tsx', source: 'Save', sourceLocale: 'en', targetLocale: 'sv' },
    { fileId: 'src/a.tsx', source: 'Cancel', sourceLocale: 'en', targetLocale: 'sv' },
  ]);
  expect(result).toEqual(['Spara', 'Avbryt']);
});
```

The outer `translator.batch(requests)` API stays per-locale on input and output. yapyak's compiler hands it the full list of `(file, source, locale)` requests it needs filled, and the factory deduplicates them before reaching your `translate` callback. The shipped translators have similar tests. Open the source under `packages/translator/src/` for examples.
