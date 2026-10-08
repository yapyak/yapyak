---
'@yapyak/vue': patch
---

Extract `t()` calls from the source of a `v-for` written with `of`. The processor passed the whole directive, such as `item of items`, to the compiler. With `of` that text is not valid JavaScript, so its `t()` calls were found only through the error recovery of the bundled TypeScript parser, which yapyak no longer uses. The processor now passes only the expression after `in` or `of`, which Vue's parser already separates.
