---
"yapyak": patch
---

Report a placeholder name that ICU does not allow as YAP0052. The parser accepted any text between the braces, so `t('Hi {first name}')` extracted a placeholder named `first name` and demanded a params key of that name, while the type level refused it and typed `t()` as taking a single argument. No spelling satisfied both, and the only thing you saw was `Expected 1 arguments, but got 2` with no mention of the placeholder. Such a name now fails the dev server, `yapyak check`, and the build with YAP0052 on the file that holds the call. The params checks stay quiet until the name is valid, the way they already do for a source string that does not parse.
