---
'@yapyak/astro': patch
---

The Astro compiler reports byte offsets. The processor converts them to string indices, so a non-ASCII character no longer drops every `t()` call that follows it. A single accented character in frontmatter dropped every source string in the file.
