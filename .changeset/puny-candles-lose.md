---
'yapyak': patch
---

Import removal counts call-shaped uses of the local name across the whole emitted file, not only the fragment-covered text. A `t()` call in text no fragment covered lost the `yapyak` import it still needed, so the built component crashed at runtime; the import now stays in place.
