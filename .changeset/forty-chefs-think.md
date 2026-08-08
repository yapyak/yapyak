---
'yapyak': patch
---

A processor reports its parser's errors through `ParseSourceResult.diagnostics`. The compiler surfaces each one as a `YAP0048` diagnostic with the parser's message and location, so a file the parser cannot read fails the build instead of silently losing its `t()` calls.
