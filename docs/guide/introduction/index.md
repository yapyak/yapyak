# Introduction

yapyak is an AI-native i18n library for Vite. Your source code is the source of truth. Translations are side-effects.

You write `t('Save changes')` in your component. The plugin extracts it, sends it to Anthropic, OpenAI, Gemini, or Ollama — with your voice, the file path, and surrounding element as context — and writes translations to every locale. HMR pushes the new copy live before you switch tabs.

The default language never lives in a JSON file. It lives in your code. Other locales are derived from it: regenerated on save, never authored. Like compiled JavaScript. Like generated types. They exist on disk because you need them at runtime, not because you maintain them.

## Why this shape

The old i18n flow was built for human translators on quarterly cycles: write copy in English, extract keys, push to a translation portal, wait for a human, pull, build, deploy. That world doesn't exist anymore. Modern teams ship copy constantly — button labels mutate three times a day, empty states get rewritten mid-sprint. The bottleneck stopped being the translation. It became the loop around it.

AI removed the bottleneck. UI translation is correct on the first try 95% of the time. With voice and call-site context — which yapyak passes to the model automatically on every save — 95–100%. You still ship when you're ready: AI writes to the locale files, you review the diff, edit if needed, commit. The indirection that abstract translation keys provided is no longer earning its keep.

So yapyak removes it. The string is the key. There is no `en.json`. The AI handles the rest.

## What you get

- **Auto-translation on save.** Save the file, every locale updates via HMR — in your voice, with the call site as context.
- **Your AI, your bill.** Pick Anthropic, OpenAI, Gemini, or Ollama. No SaaS tier, no per-seat pricing. Typical apps: $1–5/year in API calls. Free with Ollama.
- **Context-aware.** Component name, enclosing element, surrounding code. You choose how much code reaches the AI: none, minimal, or rich.
- **Tree-shaken per chunk.** No runtime JSON, no central catalog, no barrel imports. Translations compile inline at the call site, bundles scale with usage.
- **Source code is the truth.** The source string is the key, the default translation, and lives co-located with your code. No en.json to keep in sync.
- **Manual translation, too.** AI is opt-in. Drop the translator option and yapyak becomes a clean source-as-keys library — stubs you fill, locales in your repo.
- **Same `t` for React, Svelte, Vue.** SSR adapters for TanStack Start and SvelteKit. Reactivity is the only framework-specific piece, exposed as `useLocale`.
- **Position-aware rename memory.** Edit a string and translations migrate without losing existing work.
- **Per-file scoping.** Same source string in two files = two independent entries. The AI disambiguates without you annotating.
- **Type-safe params.** TypeScript extracts placeholders from the source string at the call site — `t('Hello {name}')` requires `{ name: ... }`. ICU plurals require `number`, selects require `string`. No codegen, no `.d.ts` files to maintain.
- **ICU at runtime.** Plurals, ordinals, selects, named placeholders. Per-locale CLDR categories via `Intl.PluralRules`. Recursive interpolation.
- **CLI.** Add languages, fill missing translations, snapshot for handoff, status report, CI checks. Zero runtime dependencies.

## Where to go next

- [Installation](/guide/installation) — install the package, configure the Vite plugin, add your first locale.
- [How it works](/guide/how-it-works) — what the plugin does on save, how the AI loop is orchestrated, how the runtime resolves locale.
- [Translations](/guide/translations/) — the `t()` function, params, plurals, forced locale, per-file scoping.
- [Locales](/guide/locales/) — adding locales, persistence, the reactive locale binding per framework.
