---
'yapyak': patch
'@yapyak/anthropic': patch
'@yapyak/astro': patch
'@yapyak/claude-code': patch
'@yapyak/gemini': patch
'@yapyak/nuxt': patch
'@yapyak/ollama': patch
'@yapyak/openai': patch
'@yapyak/react': patch
'@yapyak/react-router': patch
'@yapyak/svelte': patch
'@yapyak/sveltekit': patch
'@yapyak/tanstack-start': patch
'@yapyak/vite': patch
'@yapyak/vue': patch
---

Require Node.js 22.23.4 or later. The October 2026 Node.js security releases shipped in 22.23.4 and 24.22.1, and Astro 7.4.2 declares `"node": ">=22.23.4"`, so `@yapyak/astro` already needs that version to build. Every package now declares the same `engines` range. See `BREAKING.md` for the upgrade steps.
