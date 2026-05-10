# Introduction

yapyak is an i18n library where your source code is the source of truth. Translations are side-effects.

You write `t('Save changes')` in your component. The plugin extracts the string, sends it to the AI of your choice — with your voice, the file path, the surrounding element — and writes translations to every locale. HMR pushes the new copy live before you switch tabs.

The default language never lives in a JSON file. It lives in your code. Other locales are derived from it: regenerated on save, never authored. Like compiled JavaScript. Like generated types. They exist on disk because you need them at runtime, not because you maintain them.

## Why this shape

The old i18n flow was built for human translators on quarterly cycles: write copy in English, extract keys, push to a translation portal, wait for a human, pull, build, deploy. That world doesn't exist anymore. Modern teams ship copy constantly — button labels mutate three times a day, empty states get rewritten mid-sprint. The bottleneck stopped being the translation. It became the loop around it.

AI removed the bottleneck. UI translation is correct on the first try 95% of the time. With voice and call-site context — which yapyak passes to the model automatically on every save — 95–100%. The indirection that abstract translation keys provided is no longer earning its keep.

So yapyak removes it. The string is the key. There is no `en.json`. The AI handles the rest.

## What you get

- **Source-as-keys.** `t('Save changes')` is the lookup. No central registry, no naming meeting.
- **Auto-translate on save.** Anthropic, OpenAI, or any custom translator. Batched, voice-consistent, context-aware.
- **Position-aware rename memory.** Edit a string and translations migrate without losing existing work.
- **Per-file scoping.** Same English in two files = two independent entries. The AI disambiguates without you annotating.
- **Type-safe params.** TypeScript reads the source string and infers the param shape. ICU plurals and selects checked at the call site.
- **One `t` for React, Svelte, Vue.** Reactivity is the only framework-specific piece, exposed as `useLocale`.
- **SSR adapters.** TanStack Start and SvelteKit. One function call wires per-request locale resolution.
- **CLI.** Add languages, translate missing, force re-translation, status, CI checks. Zero runtime dependencies.

## What it doesn't do

- **Webpack.** yapyak is Vite-only by design.
- **Translation portals.** No Crowdin integration, no per-seat pricing, no vendor in your billing path.
- **Rich text in `t()`.** For `<strong>` or `<a>` inside a translation, you compose them in code around the string. A `<Trans>` component is on the roadmap.
- **A SaaS tier.** It's MIT, BYO key, no telemetry. Built for our own products.

## Where to go next

- [Installation](/guide/installation) — install the package, configure the Vite plugin, add your first locale.
- [How it works](/guide/how-it-works) — what the plugin does on save, how the AI loop is orchestrated, how the runtime resolves locale.
- [Translations](/guide/translations/) — the `t()` function, params, plurals, forced locale, per-file scoping.
- [Frameworks](/guide/frameworks/) — React, Svelte, Vue integration.
