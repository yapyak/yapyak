---
'@yapyak/astro': patch
'@yapyak/vite': patch
---

Add the keywords the ecosystem directories index on. The Vite plugin registry pulls plugins from npm daily by the `vite-plugin` keyword, and the Astro integrations library pulls weekly by `astro-integration`, so neither package was listed without them.
