---
"yapyak": patch
---

Report a translation nothing uses as YAP0053. A locale file kept every entry it was ever given, so a translation left behind by an edited or deleted `t()` call sat there with nothing to say it was dead weight. `yapyak check` now warns on such an entry and points at the line it is written on. The warning does not fail the check, because a leftover entry breaks nothing, and it is skipped for any source file the compiler could not read, so a file with a syntax error never makes its translations look unused.
