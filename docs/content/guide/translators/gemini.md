---
title: Gemini
order: 3
---

Use Google's Gemini models as your translator. Gemini's strength: cost-effective multilingual translation with native handling of non-Latin scripts (Japanese, Korean, Arabic, Hebrew).

```ts
import { yapyak } from 'yapyak/vite';
import { gemini } from 'yapyak/translator';

yapyak({
  translator: gemini({
    apiKey: process.env.GEMINI_API_KEY!,
    voice: 'Casual, thoughtful, never corporate.',
  }),
})
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
| `apiKey` | — | Required. Set via `.env.local` (`GEMINI_API_KEY`). |
| `model` | `'gemini-2.5-flash'` | Any Gemini model. `gemini-2.5-pro` for higher quality. |
| `endpoint` | `'https://generativelanguage.googleapis.com/v1beta'` | Base URL — model name is appended automatically. |

See [Shared options](/guide/translators#shared-options) for `voice`, `glossary`, `context`, `batchSize`, `temperature`, `headers`, `timeout`, `maxRetries`.

## Why Gemini for translation

Gemini was trained on Google's translation pipeline. Empirically strong on non-Latin scripts (Japanese, Korean, Arabic, Hebrew) and Asian-language idiom handling. For UI translation projects with significant non-Latin-script coverage, often produces more natural output than Claude or GPT at lower cost.

## CI

Set `GEMINI_API_KEY` as a CI secret if you translate in CI. See [Installation / CI](/guide/installation#ci) for both patterns.

## Vertex AI

Google's enterprise Gemini offering (Vertex AI) uses a different endpoint and auth scheme (OAuth2 / Application Default Credentials). yapyak's `gemini()` translator uses the consumer Gemini API (`generativelanguage.googleapis.com`). For Vertex AI, build a [custom translator](/guide/translators/custom).
