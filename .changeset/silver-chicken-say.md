---
'yapyak': patch
'@yapyak/vite': patch
---

Subscribe every component to locale changes. The component hook was injected only into components that called `t()`, so a component whose locale-dependent output came from a `format` read or from a helper in another module re-rendered on a locale change only when a parent re-rendered it, and `React.memo` or a `children` prop could stop that. The compiler now injects the hook into every component and custom hook, which is a capitalized or `use`-prefixed function that holds JSX, calls a hook, or reads `t()` or `format`, and the Vite plugin transforms files without `t()` calls when the processor declares a component hook.
