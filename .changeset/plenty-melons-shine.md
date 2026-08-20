---
'yapyak': patch
'@yapyak/vite': patch
'@yapyak/anthropic': patch
'@yapyak/gemini': patch
'@yapyak/ollama': patch
'@yapyak/openai': patch
---

Move `examples` from `defineConfig` to the translator. Everything that shapes what a translator receives — `context`, `voice`, `glossary` — is a translator option, while the example count sat in `defineConfig` and the config layer reached into `translator.context` to pick its default. `examples` is now an option on the shipped translators and on `createTranslator`: `anthropic({ apiKey, examples: 5 })`. The default is unchanged: `5`, or `0` when the translator's `context` is `'none'`. Setting `examples` in `defineConfig` is a type error now; move the value into the translator's options. Migration steps are in BREAKING.md.
