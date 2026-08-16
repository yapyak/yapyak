---
"yapyak": patch
---

Ignore a file in the locales directory whose name is not a valid locale code. Any `.json` file there became a locale on its name alone, so a stray or misspelled file counted as a language: it appeared in coverage, `yapyak check` measured it, and `yapyak translate` filled it with real translations. Only a file named after a valid BCP 47 tag is a locale now, and the rest are left alone. The dev server already warned about such a file and skipped it, so this brings the CLI in line with the plugin. `yapyak add` still rejects an invalid code up front and names the closest one.
