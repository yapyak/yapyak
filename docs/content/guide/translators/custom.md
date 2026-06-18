---
title: Custom
order: 6
---

If none of the shipped translators fit, you can build your own with `createTranslator`. The interface is a single function: take a batch of source strings and target locales, return the translations.

## The shape

```ts
import { createTranslator } from 'yapyak/translator';

const myTranslator = createTranslator({
  id: 'my-translator',
  async translate({ items, signal, sourceLocale, targetLocales }) {
    const response = await fetch('https://my-translation.internal/translate', {
      body: JSON.stringify({ items, sourceLocale, targetLocales }),
      method: 'POST',
      signal,
    });
    const data = await response.json();
    return data.translations;
  },
});
```

Pass it to your config like any other translator:

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({ translator: myTranslator });
```

yapyak handles the batching, deduplication, retry behavior, and result validation around your function — you only describe how to talk to your backend.

## The input

The `translate` callback receives a `TranslateBatchRequest`:

```ts
type TranslateBatchRequest = {
  items: TranslateItem[];
  sourceLocale: Locale;
  targetLocales: Locale[];
  signal?: AbortSignal;
};

type TranslateItem = {
  source: string;
  disambiguation?: string;       // from t.as(context, source)
  examples?: TranslationExample[];  // prior translations as style hints
  component?: string;            // call-site component name (if context level allows)
  element?: string;              // call-site element (if context level allows)
  snippet?: string;              // surrounding code (only at context: 'rich')
};
```

`items` is the batch — yapyak has already chunked it according to your `batchSize`. `sourceLocale` is your `defaultLocale` (`'en'` for most projects). `targetLocales` is every locale missing a translation for any item in the batch. `signal` is an `AbortSignal` you should forward to your fetch so cancellation propagates.

## The output

Return an array of objects, one per item, each keyed by the target locales:

```ts
[
  {
    de: 'Speichern',
    sv: 'Spara',
  },     // for items[0]
  {
    de: 'Abbrechen',
    sv: 'Avbryt',
  },    // for items[1]
]
```

The order matches `items`. Every entry must have one key per locale in `targetLocales`. yapyak validates the shape — if an entry is missing a locale or is the wrong type, the diagnostic [`YAP0034`](/guide/advanced/diagnostics) fires and that entry is dropped.

## Configuration

`createTranslator` accepts a few extras alongside `translate`:

```ts
const myTranslator = createTranslator({
  batchSize: 10,
  concurrency: 3,
  context: 'rich',
  async translate({ items, signal, sourceLocale, targetLocales }) { // … },
  id: 'my-translator',
});
```

| Option | Type | Default | Purpose |
|---|---|---|---|
| `id` | `string` | `'custom'` | Stable identifier for logging and observability |
| `batchSize` | `number` | `25` | Max items per `translate` call — yapyak chunks larger batches itself |
| `concurrency` | `number` | `5` | Max parallel `translate` calls |
| `context` | `'none' \| 'minimal' \| 'rich'` | `'minimal'` | What call-site context yapyak attaches to each item |
| `translate` | `TranslateFn` | required | The batch callback |

The shipped translators (Anthropic, OpenAI, etc.) are themselves built on top of `createTranslator` — the same defaults apply, the same lifecycle runs underneath.

## A real example: a rules-based translator

When yapyak's normal model-translator path is overkill — say, for an app whose only translations are a handful of fixed terms — a small rules-based translator drops in cleanly:

```ts
import { createTranslator } from 'yapyak/translator';

const rules: Record<string, Record<string, string>> = {
  'Cancel': {
    sv: 'Avbryt',
    de: 'Abbrechen',
  },
  'Save': {
    sv: 'Spara',
    de: 'Speichern',
  },
  'Settings': {
    sv: 'Inställningar',
    de: 'Einstellungen',
  },
};

const myTranslator = createTranslator({
  id: 'static-rules',
  async translate({ items, targetLocales }) {
    return items.map((item) => {
      const result: Record<string, string> = {};
      for (const locale of targetLocales) { result[locale] = rules[item.source]?.[locale] ?? item.source; }
      return result;
    });
  },
});
```

Strings not in the rules map fall through to the source string. Useful as a development-time placeholder before you wire up a real translator, or as a strict-no-model mode for a small handful of fixed messages.

## A real example: a routing translator

Routing translator that sends some locales to one provider and others to another:

```ts
import { createTranslator } from 'yapyak/translator';
import { anthropic } from '@yapyak/anthropic';
import { openai } from '@yapyak/openai';

const claude = anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const gpt = openai({ apiKey: process.env.OPENAI_API_KEY });

const ROUTE = {
  default: gpt,
  ja: claude,    // Claude is stronger here
  zh: claude,
};

const myTranslator = createTranslator({
  id: 'routed',
  async translate(request) {
    const byProvider = new Map<typeof claude | typeof gpt, typeof request.items>();
    // …route items per target locale, call each provider, merge results.
  },
});
```

This pattern is heavier than the shipped translators; reach for it when you have specific performance or cost reasons.

## Forwarding the AbortSignal

The `signal` parameter is an `AbortSignal` that fires when yapyak's batch run is cancelled — by a `Ctrl-C` during a CLI run, by a save during dev that supersedes an earlier in-flight call, or by an explicit `controller.abort()` if you're calling `translator.batch()` yourself.

Pass it through to your fetch (or your internal client's `signal` field). Failure to propagate the signal means cancelled runs still finish their underlying requests — wasted tokens, wasted time:

```ts
async translate({ items, signal }) {
  const response = await fetch(url, {
    body,
    method: 'POST',
    signal,
  });
  // …
}
```

## Errors you can throw

When something goes wrong, throw one of yapyak's translator errors so the surrounding machinery handles it correctly:

```ts
import {
  TranslatorAuthError,
  TranslatorNetworkError,
  TranslatorRateLimitError,
  TranslatorSafetyError,
  TranslatorTimeoutError,
} from 'yapyak/translator';

async translate({ items, signal }) {
  const response = await fetch(url, { signal });
  if (response.status === 401) {
    throw new TranslatorAuthError({ vendor: 'my-vendor' });
  }
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('retry-after')) * 1000;
    throw new TranslatorRateLimitError({
      retryAfter,
      vendor: 'my-vendor',
    });
  }
  // …
}
```

Throwing the right error type lets yapyak apply the right behavior — backoff for rate-limits, fail-fast for auth, log-and-continue for safety blocks on individual items.

If you throw a plain `Error`, yapyak treats it as a `TranslatorNetworkError` and applies the default retry policy.
