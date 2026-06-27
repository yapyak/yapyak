---
title: Custom translator
order: 3
---

When the [shipped translators](/guide/translating/providers) don't fit, [`createTranslator`](/reference/yapyak/translator/createTranslator) is the escape hatch. The interface is a single function: take a batch of source strings and target locales, return the translations.

```ts
import { createTranslator } from 'yapyak/translator';

const myTranslator = createTranslator({
  id: 'my-translator',
  async translate({ items, signal, sourceLocale, targetLocales }) {
    const response = await fetch('https://my-translation.internal/translate', {
      body: JSON.stringify({ items, sourceLocale, targetLocales }),
      method: 'POST',
      signal
    });
    const data = await response.json();
    return data.translations;
  }
});
```

Pass it to your config like any shipped translator:

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  translator: myTranslator
});
```

yapyak handles batching, deduplication, retry behavior, and result validation around your function. You describe how to talk to your backend.

Deduplication runs before your callback is invoked. Two `t()` calls with the same `fileId`, source string, and disambiguation translate once and the result is fanned back out, so your `translate` never sees the duplicate.

## Options

`createTranslator` accepts a few options alongside `translate`:

```ts
const myTranslator = createTranslator({
  batchSize: 10,
  concurrency: 3,
  context: 'rich',
  id: 'my-translator',
  async translate({ items, signal, sourceLocale, targetLocales }) {
    // ...
  }
});
```

| Option | Type | Default | Purpose |
|---|---|---|---|
| `id` | `string` | `'custom'` | Identifier for logging and observability. |
| `batchSize` | `number` | `25` | Max items per `translate` call. yapyak chunks larger batches itself. |
| `concurrency` | `number` | `5` | Max parallel `translate` calls. |
| `context` | `'none' \| 'minimal' \| 'rich'` | `'minimal'` | What call-site context yapyak attaches to each item. See [Context](/guide/translating/context). |
| `translate` | [`TranslateFn`](/reference/yapyak/translator/TranslateFn) | required | The batch callback. |

The shipped [translators](/guide/translating/providers) are themselves built on `createTranslator`. The same defaults apply, the same lifecycle runs underneath.

## The input

The `translate` callback receives a [`TranslateBatchRequest`](/reference/yapyak/translator/TranslateBatchRequest):

```ts
type TranslateBatchRequest = {
  items: TranslateItem[];
  signal?: AbortSignal;
  sourceLocale: Locale;
  targetLocales: Locale[];
};

type TranslateItem = {
  source: string;
  component?: string;
  element?: string;
  snippet?: string;
  disambiguation?: string;
  examples?: TranslationExample[];
};
```

`TranslateBatchRequest`:

- **`items`** — the batch, chunked by yapyak according to your `batchSize`.
- **`sourceLocale`** — your `defaultLocale` (`'en'` for most projects).
- **`targetLocales`** — every locale missing a translation for any item in the batch.
- **`signal`** — an `AbortSignal` you forward to your fetch so cancellation propagates.

`TranslateItem`:

- **`source`** — the string to translate.
- **`component`** — the call-site component name (sent at context `'minimal'` or `'rich'`).
- **`element`** — the enclosing element (sent at context `'minimal'` or `'rich'`).
- **`snippet`** — surrounding code (sent only at context `'rich'`).
- **`disambiguation`** — from `t.as(context, source)`, sent at every level.
- **`examples`** — prior translations sent as style hints.

## The output

Return an array of objects — same order as `items`, each keyed by the target locales:

```ts
[
  {
    de: 'Speichern',
    sv: 'Spara'
  },
  {
    de: 'Abbrechen',
    sv: 'Avbryt'
  }
]
```

The order matches `items`. Every entry has one key per locale in `targetLocales`. yapyak validates the result and surfaces shape failures as YAP diagnostics. See [Errors](/guide/translating/errors).

## Forwarding the AbortSignal

The `signal` parameter fires when yapyak's batch run is cancelled: by `Ctrl-C` during a CLI run, by a new save that supersedes an earlier in-flight call, or by an explicit `controller.abort()` from your own code.

{% callout variant="warning" %}
Forward it to your fetch (or your client's `signal` field). Without it, cancelled runs still complete their underlying requests, wasting tokens and time.
{% /callout %}

```ts
async translate({ items, signal }) {
  const response = await fetch(url, {
    body: JSON.stringify(items),
    method: 'POST',
    signal
  });
  // ...
}
```

## Errors to throw

When something goes wrong, throw one of yapyak's [translator error types](/guide/translating/errors) so the surrounding machinery handles it correctly:

```ts
import {
  TranslatorAuthError,
  TranslatorRateLimitError
} from 'yapyak/translator';

async translate({ items, signal }) {
  const response = await fetch(url, { signal });
  if (response.status === 401) {
    throw new TranslatorAuthError('Auth failed', { vendor: 'my-vendor' });
  }
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('retry-after')) * 1000;
    throw new TranslatorRateLimitError('Rate limited', {
      retryAfter,
      vendor: 'my-vendor'
    });
  }
  // ...
}
```

Throwing the right type lets yapyak apply the right policy: backoff for rate limits, fail-fast for auth. See [Errors](/guide/translating/errors) for the full taxonomy.

Any other error that escapes the callback — a plain `Error`, an exception from your fetch client — fails the whole chunk and surfaces as [`YAP0033`](/reference/diagnostics/YAP0033). The rest of the batch's chunks complete normally.

## A rules-based translator

When the model translator path is overkill — say, an app whose only translations are a handful of fixed terms:

```ts
import { createTranslator } from 'yapyak/translator';

const rules: Record<string, Record<string, string>> = {
  Cancel: {
    sv: 'Avbryt',
    de: 'Abbrechen'
  },
  Save: {
    sv: 'Spara',
    de: 'Speichern'
  },
  Settings: {
    sv: 'Inställningar',
    de: 'Einstellungen'
  }
};

const rulesTranslator = createTranslator({
  id: 'static-rules',
  async translate({ items, targetLocales }) {
    return items.map((item) => {
      const result: Record<string, string> = {};
      for (const locale of targetLocales) {
        result[locale] = rules[item.source]?.[locale] ?? item.source;
      }
      return result;
    });
  }
});
```

Strings not in the rules map fall through to the source string. Useful as a dev-time placeholder, or as a strict-no-model mode for a small handful of fixed messages.

## A routing translator

Routing translator that sends some locales to one provider and others to another:

```ts
import { createTranslator } from 'yapyak/translator';
import { anthropic } from '@yapyak/anthropic';
import { openai } from '@yapyak/openai';

const claude = anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const gpt = openai({ apiKey: process.env.OPENAI_API_KEY });

function pickProvider(targetLocale: string) {
  if (targetLocale === 'ja' || targetLocale === 'zh') {
    return claude;
  }
  return gpt;
}

const routedTranslator = createTranslator({
  id: 'routed',
  async translate({ items, signal, sourceLocale, targetLocales }) {
    const results = await Promise.all(
      targetLocales.map((targetLocale) =>
        pickProvider(targetLocale).translate({
          items,
          signal,
          sourceLocale,
          targetLocales: [targetLocale]
        })
      )
    );
    return results.flat();
  }
});
```

Each target locale routes to its provider. `Promise.all` fans the calls out concurrently. yapyak handles the outer batching and result validation. Heavier than the shipped translators; reach for it when you have a specific reason.
