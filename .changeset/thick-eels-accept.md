---
'yapyak': patch
---

Parse source files with `oxc-parser` instead of a bundled copy of the TypeScript 6 compiler. yapyak bundled TypeScript 6 into its package to read source files. It no longer needs to, and `oxc-parser` installs as a regular dependency.
