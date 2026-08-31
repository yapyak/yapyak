---
'yapyak': patch
'@yapyak/react': patch
---

Subscribe every React component to locale changes regardless of how it is written. The compiler previously injected the locale subscription only into named function declarations and block-bodied arrows, so components written as concise arrows, wrapped in `memo`-style calls, returned from higher-order components, or held in object properties rendered once and never updated on a locale switch. The compiler now finds the component for every `t()` call by walking up from the call itself, accepting a function either by its name or by evidence in its body, so custom wrappers work without any configured list. The injected hook is also emitted under a `use`-prefixed name so React Fast Refresh counts it in its hook signature.
