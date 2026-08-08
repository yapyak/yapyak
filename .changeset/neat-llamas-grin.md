---
'@yapyak/astro': patch
---

The Astro compiler's parse errors surface as `YAP0048` diagnostics in files with frontmatter. A file the compiler could not fully parse dropped `t()` calls and removed imports with no signal; the same file now fails the build with the compiler's message and location. A file without frontmatter keeps the whole-file script fallback, where no `t()` call can be lost.
