---
layout: home

hero:
  name: yapyak 🐃
  text: i18n that doesn’t suck
  tagline: Let your app yak in any language.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/yapyak/yapyak

features:
  - icon: '🐃'
    title: Source-string-as-key
    details: The English text is the lookup key. No abstract IDs. No naming things. Tailwind energy for translations.

  - icon: '⚡'
    title: Auto-translate on save
    details: Write t('Hello'), save, and two seconds later the Swedish version is in your UI. Powered by Claude, OpenAI, or your own AI agent.

  - icon: '↻'
    title: Position-aware memory
    details: Rename a string in code and the existing translation moves with it. No re-AI cost, no lost human edits. Nobody else does this.

  - icon: '🌐'
    title: Zero-config SSR
    details: getLocale() works on the server and in the browser. Same import, same call site, no isomorphism dance.

  - icon: '🔒'
    title: Typed to the bone
    details: Autocomplete on every t() call. Params inferred from the source string. Locale codes as a discriminated union. Refactoring just works.

  - icon: '📦'
    title: One package
    details: Vite plugin, runtime, AOT compiler, AI translator, CLI — all in one. No @yapyak/* sprawl.
---
