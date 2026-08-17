---
"yapyak": patch
---

Skip the plural-category check for a locale the machine has no plural data for. `Intl.PluralRules` falls back to the machine's default locale for a language it does not know, so a valid but unknown locale code was checked against that locale's categories: YAP0045 could reject a `few` branch that is right for the language, and the verdict changed from machine to machine. Such a locale now passes YAP0045 and the translation gate, and the translator is told to keep the branches of the source.
