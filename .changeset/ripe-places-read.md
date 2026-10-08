---
'yapyak': patch
---

Stop `yapyak clean` from deleting the translations of a source file that does not parse. `clean` counted such a file as using none of its translations, so `yapyak clean --write` removed every entry of a file whose markup did not parse. `clean` now leaves the entries of a file that does not parse in place until it parses again, the way `yapyak check` already did.
