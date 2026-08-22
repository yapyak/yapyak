---
'yapyak': patch
---

Export the template layer from `yapyak/template/internal`. `tokenizeTemplate`, `parseTemplate` and their types were reachable only from `yapyak/compiler/internal`, which pulls the catalog and parser code in with them; the new entry carries them on their own, and `yapyak/compiler/internal` exports the same symbols as before.
