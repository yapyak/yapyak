---
title: Providers
order: 3
---

A translator connects yapyak to a model. yapyak ships five; any other backend is a [custom translator](/guide/advanced/custom-translator) away.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })
});
```

## Shipped translators

| Provider | Import | Notes |
|---|---|---|
| [Anthropic](/reference/anthropic) | `@yapyak/anthropic` | Claude models. |
| [OpenAI](/reference/openai) | `@yapyak/openai` | GPT and reasoning models. Other OpenAI-compatible endpoints work by overriding `endpoint` and `headers`. |
| [Gemini](/reference/gemini) | `@yapyak/gemini` | Google's models. Default batch size 15. |
| [Ollama](/reference/ollama) | `@yapyak/ollama` | Local inference. No API key. Default batch size 8, timeout 120s. |
| [Claude Code](/reference/claude-code) | `@yapyak/claude-code` | Runs the local `claude` CLI on the developer's Claude subscription. No API key. Default concurrency 2, timeout 120s. |

Each factory takes an `apiKey` (except Ollama) and the [shared options](#shared-options). Provider-specific options live on each [reference page](/reference).

## Shared options

The API factories accept the same option surface. Provider pages add a handful of provider-specific extras (model defaults, vendor headers).

| Option | Type | Default | Purpose |
|---|---|---|---|
| `apiKey` | `string` | required | Provider key (not used by Ollama). |
| `model` | `string` | provider-specific | Model identifier. |
| `voice` | `string` | undefined | Tone guidance for the model. See [Voice](/guide/translating/voice). |
| `glossary` | `Record<string, Record<string, string>>` | `{}` | Pinned source-to-target translations. Inner keys are locale codes. See [Glossary](/guide/translating/glossary). |
| `context` | `'none' \| 'minimal' \| 'rich'` | `'minimal'` | How much call-site code is sent. See [Context](/guide/translating/context). |
| `examples` | `number` | `5`, or `0` when `context` is `'none'` | Existing translations sent per request as style reference. See [Examples](/guide/translating/examples). |
| `temperature` | `number` | `0.2` | Sampling temperature. |
| `maxTokens` | `number` | provider-scaled | Output token cap. |
| `timeout` | `number` | `30_000` ms | Per-request timeout. Ollama defaults to `120_000`. |
| `maxRetries` | `number` | `2` | Retries on 408/429/5xx. Ollama defaults to `1`. |
| `batchSize` | `number` | `25` | Source strings per request. Gemini `15`, Ollama `8`. |
| `concurrency` | `number` | `5` | Parallel in-flight requests. |
| `headers` | `Record<string, string>` | `{}` | Extra HTTP headers. |
| `endpoint` | `string` | provider URL | Custom API endpoint. |

Three options usually need configuration: [Voice](/guide/translating/voice), [Glossary](/guide/translating/glossary), and [Context](/guide/translating/context).

## OpenAI extras

The OpenAI factory accepts three options the others don't: `seed` (repeatable results), `organization` (org ID), and `user` (end-user ID).

```ts
openai({
  apiKey: process.env.OPENAI_API_KEY,
  seed: 42,
  organization: 'org-abc',
  user: 'user-123'
})
```

Reasoning models (`gpt-5*`, `o1`–`o9`) auto-switch internally: `maxTokens` becomes `max_completion_tokens` in the API call, and `temperature` is dropped since reasoning models don't accept it.

## Gemini extras

Gemini exposes two distinct safety verdicts: a generic `SAFETY` block and a `RECITATION` block (model output too close to training data). Both surface as [`TranslatorSafetyError`](/reference/yapyak/translator/TranslatorSafetyError), but the `cause` differs so you can branch on it.

## Ollama

`ollama()` has no required arguments. It defaults to `http://localhost:11434/api/generate` and model `llama3.1`. Install [Ollama](https://ollama.com/download), pull the model, and the factory connects:

```bash
ollama pull llama3.1
```

```ts
ollama()
```

Ollama defaults to a 120s timeout and 1 retry (versus 30s/2 for the API providers) to accommodate cold-start latency on local hardware.

## Claude Code

`claudeCode()` has no required arguments. It spawns the `claude` CLI in print mode, so translation runs on the developer's Claude subscription instead of an API key. Install [Claude Code](https://claude.com/claude-code) and sign in by running `claude` once. If translation fails with an authentication error, the CLI's saved token has expired. Run `/login` to refresh it.

```ts
claudeCode()
```

{% callout variant="info" %}
Translations run in their own `claude` processes, on the same subscription as the CLI and outside the project directory. The compiler hands each batch the context it needs, so a Claude Code session open in the same project keeps working undisturbed.
{% /callout %}

The HTTP options don't apply: there is no `apiKey`, `endpoint`, `headers`, `temperature`, `maxTokens`, or `maxRetries`. `model` falls back to the CLI's configured model when omitted. Concurrency defaults to 2 and `timeout` to 120s, since each batch is a CLI process rather than an HTTP request.

CI has no signed-in CLI. That only matters when CI actually translates: `yapyak check` never touches the translator, so a plain `claudeCode()` config is fine for a check-only pipeline. For a pipeline that runs [`yapyak translate`](/reference/cli/translate), pick the translator by environment:

```ts
translator: process.env.CI
  ? anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : claudeCode()
```

## Switching providers

The translator is one config field. To switch, swap the factory and the import. Existing translations stay. `yapyak translate --force` re-runs the new translator over every entry; see [Coverage](/guide/translating/coverage).

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';
import { openai } from '@yapyak/openai';

export default defineConfig({
  translator: openai({
    apiKey: process.env.OPENAI_API_KEY
  })
});
```
