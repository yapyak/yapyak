---
title: Gemini
order: 3
---

## Install

{% code-group %}

```bash [npm]
npm install @yapyak/gemini
```

```bash [pnpm]
pnpm add @yapyak/gemini
```

```bash [bun]
bun add @yapyak/gemini
```

{% /code-group %}

## Setup

Use Google's Gemini models as your translator.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak';
import { gemini } from '@yapyak/gemini';

export default defineConfig({
  translator: gemini({
    apiKey: process.env.GEMINI_API_KEY!,
    voice: 'Casual, thoughtful, never corporate.',
  }),
});
```

Get an API key at [aistudio.google.com](https://aistudio.google.com).

## Options

```ts
interface GeminiOptions {
  apiKey: string;
  voice?: string;
  glossary?: Record<string, Record<string, string>>;
  context?: 'none' | 'minimal' | 'rich';
  batchSize?: number;
  concurrency?: number;
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
| `model` | `'gemini-2.5-flash'` | Any Gemini model. |
| `endpoint` | `'https://generativelanguage.googleapis.com/v1beta'` | Base URL — model name is appended automatically. |

See [Shared options](/guide/translators#shared-options) for `voice`, `glossary`, `context`, `batchSize`, `concurrency`, `temperature`, `headers`, `timeout`, `maxRetries`.

## Vertex AI

Google's enterprise Gemini offering (Vertex AI) uses a different endpoint and auth scheme (OAuth2 / Application Default Credentials). yapyak's `gemini()` translator uses the consumer Gemini API (`generativelanguage.googleapis.com`). For Vertex AI, build a [custom translator](/guide/translators/custom).
