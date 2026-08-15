---
"yapyak": patch
---

Stop reporting params problems when the source string is malformed. An unclosed brace left the placeholder set unknown, and every params key was reported as extra, so the fix in the hint was to delete a correct parameter instead of closing the brace. The malformed source is now the only diagnostic for that call, and params are validated again as soon as the string parses.
