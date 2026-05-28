---
title: Anthropic
order: 2
---

## Install

```bash
npm install @yapyak/anthropic
# or
pnpm add @yapyak/anthropic
```

## Setup

Use Claude (Sonnet, Opus, Haiku) as your translator.

```ts
// yapyak.config.ts
import type { YapyakConfig } from '@yapyak/vite/config';
import { anthropic } from '@yapyak/anthropic';

export default {
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    voice: 'Casual, thoughtful, never corporate.',
  }),
} satisfies YapyakConfig;
```

Get an API key at [console.anthropic.com](https://console.anthropic.com).

## Options

```ts
interface AnthropicOptions {
  apiKey: string;
  voice?: string;
  glossary?: Record<string, Record<string, string>>;
  context?: 'none' | 'minimal' | 'rich';
  batchSize?: number;
  model?: string;
  temperature?: number;
  endpoint?: string;
  headers?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
}
```

| Option | Default | Notes |
| --- | --- | --- |
| `apiKey` | — | Required. |
| `model` | `'claude-sonnet-4-6'` | Any Claude model. |
| `endpoint` | `'https://api.anthropic.com/v1/messages'` | Override for private deployments or proxies. |

See [Shared options](/guide/translators#shared-options) for `voice`, `glossary`, `context`, `batchSize`, `temperature`, `headers`, `timeout`, `maxRetries`.
