---
title: Custom translator
order: 3
---

[`createTranslator`](/reference/yapyak/translator/createTranslator) builds a translator from a single async callback. Use it when the [shipped translators](/guide/translating/providers) don't cover your provider — a self-hosted endpoint, a custom proxy, a TMS integration.

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

You write the call to your backend. yapyak handles batching, deduplication, and result validation.

Deduplication runs before your callback. Two `t()` calls with the same `fileId`, source string, and disambiguation translate once; the result is reused for both, so your `translate` never sees the duplicate.

## Options

`createTranslator` accepts a few options alongside `translate`:

```ts
const myTranslator = createTranslator({
  batchSize: 10,
  concurrency: 3,
  context: 'rich',
  examples: 3,
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
| `examples` | `number` | `5`, or `0` when `context` is `'none'` | Max style-reference [examples](/guide/translating/examples) yapyak attaches to each item. |
| `translate` | [`TranslateFn`](/reference/yapyak/translator/TranslateFn) | required | The batch callback. |

The shipped [translators](/guide/translating/providers) are themselves built on `createTranslator` with these same defaults and lifecycle.

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
- **`attribute`** — the enclosing attribute name when the source is an attribute value (sent at context `'minimal'` or `'rich'`).
- **`component`** — the call-site component name (sent at context `'minimal'` or `'rich'`).
- **`element`** — the enclosing element (sent at context `'minimal'` or `'rich'`).
- **`snippet`** — surrounding code (sent only at context `'rich'`).
- **`disambiguation`** — from `t.as(context, source)`, sent at every level.
- **`examples`** — prior translations sent as style reference (sent at context `'minimal'` or `'rich'`).

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

When a request fails, throw one of yapyak's [translator error types](/guide/translating/errors) — the same taxonomy the shipped providers raise:

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

yapyak runs your callback once — it won't retry it or act on `retryAfter`. A typed error, or any other error that escapes the callback, fails that chunk and surfaces as [`YAP0033`](/reference/diagnostics/YAP0033); the batch's other chunks complete normally. For backoff, retry inside the callback and honor `Retry-After` yourself — the shipped translators do this at their [fetch layer](/guide/translating/errors#retry-behavior). See [Errors](/guide/translating/errors) for the full taxonomy.

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
    const byLocale = await Promise.all(
      targetLocales.map((targetLocale) =>
        pickProvider(targetLocale).translate({
          items,
          signal,
          sourceLocale,
          targetLocales: [targetLocale]
        })
      )
    );

    return items.map((_, index) =>
      Object.assign({}, ...byLocale.map((localeResults) => localeResults[index]))
    );
  }
});
```

Each target locale routes to its provider; `Promise.all` fans the calls out concurrently. The per-locale results merge by item index into one object per source string. yapyak handles the outer batching and result validation. Heavier than the shipped translators; reach for it when you have a specific reason.
