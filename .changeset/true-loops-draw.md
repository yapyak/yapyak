---
"yapyak": patch
---

Keep colouring an ICU message after an unclosed `{`. `tokenizeTemplate` marked nothing from an unclosed brace to the end of the message, so an editor lost every colour in the message the moment a brace was typed and got it back only once the brace was closed. The placeholder name, the argument kind, the branch keys and `#` are marked up to the end of the message now; only the missing closing brace goes unmarked, and the diagnostic still reports it.
