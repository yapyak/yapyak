---
'@yapyak/astro': patch
---

The Astro compiler's parse errors surface as `YAP0048` diagnostics. A file the compiler could not fully parse dropped `t()` calls and removed imports with no signal; the same file now fails the build with the compiler's own message and location.
