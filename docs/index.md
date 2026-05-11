---
layout: home

hero:
  name: yapyak
  text: AI-native i18n for Vite
  tagline: Write your strings once — translations write themselves.
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/yapyak/yapyak

features:
  - icon: "⚡"
    title: Auto-translation on save
    details: Edit a string, save the file, watch every locale update via HMR — in your voice, with the call site as context. Finally, i18n that ships as fast as you do.

  - icon: "💸"
    title: Your AI, your bill
    details: Pick from Anthropic, OpenAI, Gemini, Ollama — or wire up your own in 30 lines. Your key, your bill, no middleman. Each string runs once and caches — cheaper than you'd think. Typical apps, $1–5 a year. Free with Ollama.

  - icon: "🧭"
    title: Context-aware
    details: The AI sees more than just the string. Component name, enclosing element, surrounding code — the same word in a button translates differently from the same word in a heading. Choose how much code reaches the AI — none, minimal, or rich.

  - icon: "📦"
    title: Tree-shaken per chunk
    details: No runtime JSON. No central catalog. No barrel imports. Translations compile inline at the call site, and bundles scale with usage.

  - icon: "🌱"
    title: Source code is the truth
    details: Tailwind killed CSS naming. yapyak kills i18n naming. The source string is the key, the default translation, and lives co-located with your code — no en.json to keep in sync. Source-as-strings, AI-friendly by design.

  - icon: "✏️"
    title: Manual translation, too
    details: Skip AI entirely and yapyak becomes a clean source-as-keys library. Empty stubs appear, you fill them — or hand a locale off to a human translator. Old habits welcome.
---

<div style="display: flex; gap: 3rem; justify-content: center; align-items: center; margin: 3rem 0 1rem 0; flex-wrap: wrap;">
  <img src="/logos/react.svg" alt="React" style="height: 56px; width: auto;" />
  <img src="/logos/svelte.svg" alt="Svelte" style="height: 56px; width: auto;" />
  <img src="/logos/vue.svg" alt="Vue" style="height: 56px; width: auto;" />
</div>

<p style="text-align: center; opacity: 0.7; font-size: 0.9rem; margin-top: 0;">
  SSR adapters for <a href="https://tanstack.com/start"><strong>TanStack Start</strong></a> and <a href="https://svelte.dev/docs/kit"><strong>SvelteKit</strong></a>
</p>
