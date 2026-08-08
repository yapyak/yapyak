---
'@yapyak/svelte': patch
---

The Svelte compiler's parse errors surface as `YAP0048` diagnostics. A file the compiler could not parse crashed the whole scan with a raw error naming no file; the same file now fails the build with the compiler's message and location.
