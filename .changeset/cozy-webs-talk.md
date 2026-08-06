---
'@yapyak/vite': patch
'yapyak': patch
---

Vite no longer pre-bundles yapyak's runtime modules. The first `vite dev` request stops reloading the page, and React apps stop logging `Invalid hook call` on the first render.
