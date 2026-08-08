---
'@yapyak/astro': patch
---

Frontmatter detection follows the Astro compiler instead of a regex. A byte order mark or whitespace around the opening fence made the processor treat the whole file as script, so every `t()` call in it was left in the built page.
