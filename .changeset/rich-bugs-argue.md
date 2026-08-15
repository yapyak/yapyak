---
"@yapyak/vue": patch
---

Report a `.vue` file that does not parse. The processor read the descriptor from `@vue/compiler-sfc` and dropped the errors beside it, so a file with a missing end tag was extracted for whatever the compiler could recover and the rest of its messages were treated as removed. Such a file now reports YAP0048, which makes `yapyak check` fail on it and keeps the dev server from moving its translations into the orphan cache while the syntax is broken.
