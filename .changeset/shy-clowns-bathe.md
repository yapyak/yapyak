---
"yapyak": patch
---

Point a translation diagnostic at the entry it is about. The checks that compare a translation against its source string named the locale file but carried the range of the `t()` call in the source file, so the position travelled with a diagnostic that belonged to a different file. `validateIcuPairs` now takes the locale file's text and resolves the exact span of the offending translation, which lets an editor underline the broken entry where it is written.
