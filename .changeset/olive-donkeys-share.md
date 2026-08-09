---
"@yapyak/vite": patch
---

Invalidate every module graph — including the client — when a locale file changes, instead of force-reloading server environments. Reloaded pages no longer hydrate with stale cached translations, and Astro's dev server no longer breaks on locale file saves.
