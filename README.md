![yapyak](docs/public/banner-dark.svg#gh-dark-mode-only)
![yapyak](docs/public/banner-light.svg#gh-light-mode-only)

![Works with Vite, React, Vue, Svelte, and Astro — SSR on Astro, React Router, SvelteKit, and TanStack Start](docs/public/stack-dark.svg#gh-dark-mode-only)
![Works with Vite, React, Vue, Svelte, and Astro — SSR on Astro, React Router, SvelteKit, and TanStack Start](docs/public/stack-light.svg#gh-light-mode-only)

# yapyak

**i18n that keeps up.**

[![CI](https://github.com/yapyak/yapyak/actions/workflows/ci.yml/badge.svg)](https://github.com/yapyak/yapyak/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/yapyak?logo=npm&color=cb3837&label=npm)](https://www.npmjs.com/package/yapyak)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[yapyak.dev](https://yapyak.dev)** · [Get started](https://yapyak.dev/guide/getting-started/introduction) · [Examples](https://github.com/yapyak/yapyak/tree/main/examples)

yapyak is an i18n compiler with a small runtime, built for the way code gets written today: rapidly, often with help from a coding agent, and rarely pausing for a separate translation step.

It's a Vite plugin. Works with React, Vue, Svelte, and Astro. SSR is supported on Astro, React Router, SvelteKit, and TanStack Start.

The runtime has no dependencies, built on the platform's Intl API. About 5 KB gzipped for typical use, zero for fixed-locale builds.

```tsx
import { t } from 'yapyak';

<button>{t('Save changes')}</button>
```

Save the file, and yapyak adds the string to your locale files. Connect a model and it fills in the translation in the background. Here's `locales/sv.json`:

```json
{
  "src/components/save-button.tsx": {
    "Save changes": "Spara ändringar"
  }
}
```

**[Get started → yapyak.dev](https://yapyak.dev/guide/getting-started/installation)**

---

## Features

- **Source string is the key.** Write `t('Save changes')`. There are no separate names to invent.
- **AI translation on save.** New strings are translated in the background as you work, and show up in the browser right away.
- **Context-aware AI translation.** Because yapyak is a compiler, it sends the model the code around each string, so it translates a button as a button. Set a glossary and a tone, and it learns the rest from your existing translations.
- **Bring your own AI. Or none.** Anthropic, OpenAI, Gemini, and Ollama are built in. Write your own, or skip AI and fill the JSON by hand.
- **Refactor freely.** Move or rename files and the translations come with them. yapyak won't drop a translation you still use.
- **Paranoid by default.** Missing values are caught as you type, every locale is checked on save, and the browser warns you in development. 47 numbered diagnostics, each with a page that explains the fix.
- **Production-ready i18n.** Plurals, selects, ordinals, dates, numbers, lists, and rich text that renders your own components. There's also a `format` helper for values outside a message.
- **Compiled in. Choose how much.** Translations ship inside the code that uses them and split along your routes. Build for one locale and there's no runtime at all.
- **Locale switching, handled.** Instant, with nothing to load. Keep the choice in a cookie or the URL, which work with SSR, or in local storage for a SPA.
- **Built for agents.** yapyak is designed so an agent can own i18n. It writes `t('...')` like any string, and gets clear errors early, even in the TypeScript type, so it can fix them right away.
- **Open source, not open core.** yapyak is MIT open source and runs on your machine. Your translations are JSON files in your repo. If you use a model, requests go straight to it. There's no yapyak service in between.

---

## Documentation

Everything lives at **[yapyak.dev](https://yapyak.dev)**.

- [Installation](https://yapyak.dev/guide/getting-started/installation) — a wizard picks the exact packages for your framework, SSR setup, and translator
- [Getting started](https://yapyak.dev/guide/getting-started/introduction) — from install to first translation
- [Diagnostics](https://yapyak.dev/reference/diagnostics) — all 47 codes, each with the fix
- [Examples](https://github.com/yapyak/yapyak/tree/main/examples) — 17 minimal apps, one per stack

---

## Contributing

yapyak is early, and contributions are very welcome.

Bug reports, docs fixes, examples, adapter work, and feedback from real projects all help. If you find yapyak useful, sharing it helps too.

---

## License

MIT
