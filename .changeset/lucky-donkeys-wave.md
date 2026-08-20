---
'yapyak': patch
'@yapyak/vite': patch
---

Rename `preserveTranslationsOnRename` to `preserveTranslationsOnSourceEdit`. The option governs a single case: a source string edited in place, where the existing translation either follows the new string or the string is treated as new. File moves and deleted-then-restored strings are covered by the orphan cache no matter what the option says, so the old name promised more than the option delivered — "rename" reads as a file rename, the one case it never touched. The default is unchanged: `true` without a translator, `false` with one. Setting `preserveTranslationsOnRename` is a type error now; rename the key. Migration steps are in BREAKING.md.
