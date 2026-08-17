---
"yapyak": patch
---

Tell the translator which plural categories each target locale has, and reject a translation that uses one it does not. The prompt asked the model to keep every ICU pattern identical in every locale, so a `selectordinal` with `one two few other` came back with the same four branches for Swedish, whose ordinals only have `one` and `other`, and the locale file then failed `yapyak check` with YAP0045. The prompt now states the rules exactly — keep placeholder names, argument types, `#`, `select` keys and exact matches; use only the target locale's CLDR categories, adding the ones it has and dropping the ones it lacks — and lists the cardinal and ordinal categories per target locale from `Intl.PluralRules`. `autoTranslate` checks the answer against the same categories: a branch the locale lacks is recorded as an error and the stub stays empty, the same way a dropped placeholder is handled today.
