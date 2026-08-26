---
'yapyak': patch
'@yapyak/vite': patch
---

Add `ambientBindings` to the processor contract. A processor can declare names that bind to yapyak in files that leave them unbound, with local declarations and destructures still shadowing them. `processors` also accepts nested arrays, so a factory covering several file formats returns a list.
