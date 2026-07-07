# yapyak

**i18n that keeps up.**

[![CI](https://github.com/yapyak/yapyak/actions/workflows/ci.yml/badge.svg)](https://github.com/yapyak/yapyak/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/yapyak?logo=npm&color=cb3837&label=npm)](https://www.npmjs.com/package/yapyak)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

yapyak is an i18n compiler with a small runtime, built for the way code gets written today: rapidly, often with help from a coding agent, and rarely pausing for a separate translation step.

It's a Vite plugin. Works with React, Vue, Svelte, and Astro. SSR is supported on Astro, React Router, SvelteKit, and TanStack Start.

The runtime has no dependencies, built on the platform's Intl API. About 6 KB gzipped for typical use, zero for fixed-locale builds.

Read more and documentation at [yapyak.dev](https://yapyak.dev).

```tsx
import { t } from 'yapyak'

<button>{t('Save changes')}</button>
```

Write the sentence you'd show a user. yapyak translates it and keeps it in step with your code.

## Features

- **The source string is the key.** Write `t('Save changes')` — no names to invent, no catalog to keep in sync.
- **Full ICU.** Plurals, selects, ordinals, dates, numbers, lists, and rich text that renders your own components.
- **Translation on save.** Connect a model and new strings translate in the background, live in the browser over HMR.
- **Context-aware.** The model sees the component, element, and code around each message, and follows your voice and glossary.
- **Bring your own model, or none.** Anthropic, OpenAI, Gemini, Ollama, a 30-line custom one — or fill the JSON by hand.
- **Refactor freely.** Move or rename files and the translations follow; one you still use is never quietly dropped.
- **Checked everywhere.** Missing params as you type, every locale on save, runtime warnings in dev — 44 numbered diagnostics.
- **Compiled in.** Translations code-split along your routes; a single-locale build ships no i18n runtime at all.
- **Instant switching.** Locale changes re-render — no fetch, no spinner. Cookie, URL, or storage; each server request gets its own.
- **Built for agents.** The source string is the only artifact; extract, translate, and check all happen in your repo.

## Install

```bash
npm install yapyak
```

Add the Vite plugin and you're done. See [yapyak.dev/guide/installation](https://yapyak.dev/guide/installation).

## Contributing

yapyak is early, and contributions are very welcome.

Bug reports, docs fixes, examples, adapter work, and feedback from real projects all help.

If you find yapyak useful, sharing it helps too. More real-world use brings better feedback and more edge cases.

---

MIT licensed · self-hosted · BYO LLM key
