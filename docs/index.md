---
layout: home

hero:
  name: yapyak 🐃
  text: Yap in code. The rest translates itself.
  tagline: i18n where your code is the source of truth. Translations are side-effects.
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/yapyak/yapyak

features:
  - title: Source code is the truth
    details: No `en.json` to keep in sync. The default language lives in your components, where it already is. Other locales are derived from it.
  - title: Auto-translates on save
    details: Bring your own AI key. Anthropic, OpenAI, or anything you wire up. New strings translate in seconds, in your voice, with the call-site context.
  - title: Position-aware rename memory
    details: Edit a string and translations migrate automatically. The classic source-as-keys problem, finally solved.
  - title: Works with React, Svelte, Vue
    details: Same `t()` everywhere. SSR adapters for TanStack Start and SvelteKit ship with the package.
  - title: ICU at runtime
    details: Plurals, selects, named placeholders, recursive interpolation. `t.in(locale)` for forced-locale rendering of emails and digests.
  - title: MIT, no telemetry, no Cloud
    details: Built for our own products. No paid tier, no upsell, no SaaS. Bring your AI key, own the whole loop.
---
