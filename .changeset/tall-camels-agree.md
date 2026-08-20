---
'yapyak': patch
'@yapyak/vite': patch
'@yapyak/sveltekit': patch
---

Rename `syncHtmlLang` to `syncHtmlAttributes` and sync `<html dir>` alongside `<html lang>`. The option kept the language attribute current but left the direction alone, so a right-to-left locale rendered in the wrong direction unless the app set `dir` itself. Enabled, it now writes both attributes on init and on every switch, deriving the direction from the locale's script via likely subtags: `rtl` for Arabic, Hebrew, Thaana and the other right-to-left scripts, `ltr` otherwise. The derivation ships as a new public `getTextDirection(locale)` for rendering the attributes server-side, and the SvelteKit handle now replaces a `%yapyak.dir%` placeholder next to `%yapyak.lang%`. Setting `syncHtmlLang` is a type error now; rename the key. Migration steps are in BREAKING.md.
