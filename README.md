# yapyak

**i18n that keeps up.**

[![CI](https://github.com/yapyak/yapyak/actions/workflows/ci.yml/badge.svg)](https://github.com/yapyak/yapyak/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/yapyak?logo=npm&color=cb3837&label=npm)](https://www.npmjs.com/package/yapyak)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

yapyak is an i18n compiler with a small runtime, built for the way code gets written today: rapidly, often with help from a coding agent, and rarely pausing for a separate translation step.

It's a Vite plugin. Works with React, Vue, Svelte, and Astro. SSR is supported on Astro, React Router, SvelteKit, and TanStack Start.

The runtime has no dependencies, built on the platform's Intl API. About 6 KB gzipped for typical use, zero for fixed-locale builds.

Read more and documentation at [yapyak.dev](https://yapyak.dev).

## A new way to work with i18n

Write the sentence where you use it. That's the key — no names to invent, no catalog to keep in sync.

```tsx
<button>{t('Save changes')}</button>
```

Save the file, and yapyak writes it into your locale files. Fill it in yourself, or connect a model and let it fill in while you keep working:

```diff
  // locales/sv.json
  {
    "src/components/save-button.tsx": {
-     "Save changes": ""
+     "Save changes": "Spara ändringar"
    }
  }
```

The translation lives in your repo, next to nothing but code. Move or rename the file and it comes along; delete a component and bring it back later and it returns. yapyak remembers every translation it has seen, and won't clear one you're still using.

Placeholders and counts go in the sentence too, checked by TypeScript as you type:

```tsx
t('Hi {name}', { name })
```

That's the whole loop. i18n becomes part of writing the code, not a step beside it.

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
