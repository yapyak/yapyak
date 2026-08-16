---
"yapyak": patch
---

Export `tokenizeTemplate` from `yapyak/compiler/internal`, so editors can colour an ICU message. It splits a source string into the placeholder name, the argument kind, each branch key, `#`, rich-text tag names, and the punctuation between them, to any depth of nesting.
