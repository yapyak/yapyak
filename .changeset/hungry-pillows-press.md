---
'yapyak': patch
'@yapyak/vite': patch
'@yapyak/nuxt': patch
---

Separate the source locale from the default locale. `defaultLocale` named both the language of the `t()` source strings and the locale a visitor gets when nothing else decides, so a project written in English for Swedish users had no way to start in Swedish without also treating Swedish as the source. The new `sourceLocale` option holds the source language and defaults to `defaultLocale`, so existing configs behave as before. `defaultLocale` is now only the locale that applies when no persisted or detected locale matches, and `yapyak status` marks the source locale as `(source)`.
