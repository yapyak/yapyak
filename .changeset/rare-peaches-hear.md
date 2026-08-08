---
'yapyak': patch
---

Import removal counts call-shaped uses in the source text no fragment covers, one region at a time. Overlapping fragments were subtracted twice from a whole-file count, so a call outside every fragment could still lose the `yapyak` import it needed.
