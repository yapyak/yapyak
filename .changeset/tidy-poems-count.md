---
'yapyak': patch
'@yapyak/vite': patch
'@yapyak/react': patch
'@yapyak/vue': patch
'@yapyak/svelte': patch
'@yapyak/astro': patch
'@yapyak/react-router': patch
'@yapyak/sveltekit': patch
'@yapyak/tanstack-start': patch
'@yapyak/anthropic': patch
'@yapyak/openai': patch
'@yapyak/gemini': patch
'@yapyak/ollama': patch
---

Add a top-level `types` field beside `exports` in every published package. Tools that reference the package directory rather than the bare specifier — a relativized `typeof import()` in a generated declaration, a tsconfig `paths` entry pointing at the package root — now resolve the types instead of silently landing on `any`.
