---
'yapyak': patch
---

Every text the compiler splices into the built file is read from the source file through the fragment mapping, not from the fragment's own syntax tree. A processor whose fragment code is not a verbatim copy of the source file no longer leaks that code into the output.
