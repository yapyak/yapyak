---
"yapyak": patch
---

Report a translation problem once per file instead of once per call site. `yapyak check` revalidated the same translation for every `t()` call that used the source string, so one misspelled placeholder in a locale file surfaced as two identical errors when the string appeared twice in the same source file. Each source file's translation entry is now checked once. A string used from several files still reports separately for each, because the locale file keys its translations by source file.
