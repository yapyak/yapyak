---
'yapyak': patch
'@yapyak/react': patch
---

Subscribe React hooks in `.ts` and `.js` files to locale changes. The React processor handled `.tsx` and `.jsx` files only, so a custom hook in a `.ts` file that called `t()` got no subscription of its own and updated only when a parent re-rendered it, which React Compiler prevents. The processor now handles `.ts` and `.js` files too, where a function counts as a hook only when its name starts with `use`. For custom processors, a function in a file that cannot hold JSX is eligible for the component hook only when its name also matches `evidencePattern`.
