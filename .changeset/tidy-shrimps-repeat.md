---
"yapyak": patch
---

Report a translation that does not parse. A locale file value with broken ICU syntax used to be read as a value with no placeholders, so every placeholder in the source was reported as missing from a translation that in fact holds them, and a value that was only braces was accepted without a word. Such a value now reports YAP0050 and the placeholder checks are skipped for that entry. A source string that does not parse skips those checks too, instead of reporting the translation as having placeholders the source lacks.
