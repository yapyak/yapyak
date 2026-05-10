# Auto-translation

The AI loop is what turns `t('Save changes')` into `Guardar cambios` without you opening a JSON file.

## The pipeline

On every save (in dev) and on every build (in prod):

1. **Extract** — the plugin walks the file and collects every `t()` call: source string, file path, line, column, surrounding JSX or template element.
2. **Reconcile** — compares against `locales/{locale}.json` to identify what's new, removed, or renamed.
3. **Batch** — groups missing or stale strings into chunks (default 10 per request).
4. **Translate** — sends each batch to your configured translator with full call-site context.
5. **Write** — results land in `locales/{locale}.json`.
6. **HMR** — Vite pushes the updated compiled module to the browser.

A typical save round-trips in under a second per batch.

## What gets sent to the AI

For each string, the translator receives:

```json
{
  "source": "Save changes",
  "component": "SaveButton",
  "element": "button"
}
```

Plus a system prompt containing your `voice` and `glossary` from `vite.config.ts`.

The element hint matters more than it looks. `t('Save')` inside a `<button>` translates as a verb (imperative); the same string inside an `<h1>` translates as a noun (heading). The model sees the difference and adjusts tone — without you annotating anything.

## Voice

A consistent tone across releases is the hardest part of multi-language UI. yapyak makes it a config field:

```ts
yapyak({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    voice: 'Casual, thoughtful, never corporate. Match the original cadence.',
  }),
}),
```

The string is prepended to every translation prompt. Every string, every locale, every release. Change the voice → re-run with `--force` to regenerate.

## Glossary

For domain terms that must always translate the same way:

```ts
translator: anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  voice: 'Casual, thoughtful, never corporate.',
  glossary: {
    'sign in': { es: 'iniciar sesión', fr: 'se connecter', de: 'anmelden' },
    'cart': { es: 'carrito', fr: 'panier', de: 'Warenkorb' },
    'shipping': { es: 'envío', fr: 'livraison', de: 'Versand' },
  },
}),
```

When a source string contains any glossary key, the AI is instructed to use the configured translation. Useful for brand terms, regulated language (legal, medical), or product-specific vocabulary.

## Batching

Default batch size is 10 strings per request. The translator sends one HTTP call per batch, which:

- Cuts API call count by ~10× compared to one-at-a-time
- Lets the model see related strings together (helpful for tone consistency)
- Stays well below provider rate limits

Adjust per provider:

```ts
translator: anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  batchSize: 20,   // bigger batches if you have many strings
}),
```

Larger batches = fewer requests but higher per-request token cost. The default works well for most projects.

## When the loop runs

| Trigger | What happens |
| --- | --- |
| `vite dev` save | Plugin extracts changed file, batches new strings, writes to JSON, HMR |
| `vite build` | Full project extract + translate + write before bundling |
| `npx yapyak add <locale>` | Creates `locales/{locale}.json`, batches every string, writes |
| `npx yapyak translate` | Fills missing translations across all locales |
| `npx yapyak translate <locale>` | Same, single locale |
| `npx yapyak translate --force` | Re-translates everything across all locales |
| `npx yapyak translate <locale> --force` | Re-translates everything in one locale |

## Force re-translate

`--force` bypasses the "is this already translated?" check and re-runs every string through the AI. Use when:

- You changed the voice prompt and want all existing translations to match
- You upgraded the model (e.g., new Claude version) and want fresh output
- A specific locale's translations feel inconsistent and you want a clean pass
- You added a glossary term and want it applied retroactively

```bash
npx yapyak translate es --force   # rebuild Spanish from scratch
npx yapyak translate --force      # rebuild every non-default locale
```

::: warning
`--force` overwrites everything, including manually-edited translations. If you've fine-tuned a specific entry by hand, `--force` will replace it with a fresh AI translation. Audit your `git diff` before committing.
:::

## Skipping translation

If you want a string to stay as the source language (e.g. brand name, code keyword), don't translate it differently across locales — just write it once and let yapyak handle the rest. The plugin will still produce per-locale entries, but they'll all be the same.

For strings that should *never* go through AI translation (proper nouns, version numbers, code), use them outside `t()`:

```tsx
<h1>{t('Welcome to')} React</h1>           // 'React' is hardcoded, not a translation
<h1>{t('Welcome to')} {appName}</h1>        // appName is a variable, not a translation
```

The string `'Welcome to'` translates; `'React'` and `appName` are concatenated as-is.

## Failure handling

If the translator returns an error (rate limit, API down, malformed response):

- The failed batch is logged with file, source string, and error message
- Other locales and other batches continue
- Failed entries remain as empty stubs in `locales/{locale}.json`
- The next save (or `yapyak translate`) retries them

The build doesn't fail because of translation errors. CI uses `npx yapyak check` to assert all translations are present, separately from translation pipeline health.

## Cost

Cost depends on string count, locale count, and model. Rough numbers with Claude Sonnet 4.6 at default batch size 10:

- ~100 input tokens per batch (system prompt + 10 strings)
- ~150 output tokens per batch (10 translations)
- ≈ $0.0008 per batch at current pricing

A project with 200 strings × 5 non-default locales = 100 batches = roughly $0.08 total to translate everything from scratch. Subsequent saves only re-translate the diff, so day-to-day cost is negligible.

You're paying the AI provider directly. yapyak is in no part of the billing path.

## Bring your own translator

The provided `anthropic()` and `openai()` translators implement the `Translator` interface. Drop in your own — local Ollama, custom endpoint, fine-tuned 7B, whatever — and the rest of the pipeline works unchanged.

See [Translators / Custom](/guide/translators/custom).
