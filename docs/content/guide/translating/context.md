---
title: Context
order: 7
---

`context` controls how much call-site code yapyak sends with each translation request. The model uses it to disambiguate short messages.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    context: 'minimal'
  })
});
```

Default is `'minimal'`.

## The three levels

| Level | What's sent | When to use |
|---|---|---|
| `'none'` | Source string only. | Privacy-sensitive code. The strict-no-leakage setting. |
| `'minimal'` | Source, plus component name and enclosing element when known. | Default. Enough to tell `Open` (button) from `Open` (status badge). |
| `'rich'` | Above plus a snippet of surrounding source code. | When voice and glossary aren't enough to disambiguate. |

A higher level produces better translations for tricky strings at the cost of more tokens per request.

A [disambiguation](/guide/writing/homonyms) from `t.as(context, source)` is sent at every level, including `'none'`. It travels with the source string rather than with the call-site context.

## What `'minimal'` actually sends

For this call:

```tsx [src/components/file-menu.tsx]
<button onClick={openFile}>{t('Open')}</button>
```

The request carries:

```ts
{
  source: 'Open',
  component: 'FileMenu',
  element: 'button'
}
```

Enough for the model to translate `Open` as the imperative verb on a button rather than the adjective "open" describing a state.

## What `'rich'` adds

The same call at `context: 'rich'` adds a `snippet`:

```ts
{
  source: 'Open',
  component: 'FileMenu',
  element: 'button',
  snippet: "<button onClick={openFile}>{t('Open')}</button>"
}
```

The model sees the handler name and any sibling markup, which is usually enough to nail down meaning the component name alone misses.

## Privacy

Call-site context is part of the request to your provider. It goes from your machine to the model and never routes through yapyak. If your provider's terms of service worry you, `'none'` is the strict-privacy setting and turns off [`examples`](/guide/translating/examples) as well.

## Per-item examples

The `context` setting also affects whether yapyak sends [`examples`](/guide/translating/examples). With `context: 'none'`, the default for `examples` is `0`.
