---
'yapyak': patch
---

Report a source file with a syntax error as `YAP0048`. The bundled TypeScript parser read past a syntax error and extracted the `t()` calls it could recover, so `yapyak check` passed a file that does not compile. A script that does not parse is now reported like markup that does not parse, and none of its `t()` calls are extracted until it parses again.
