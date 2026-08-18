---
"yapyak": patch
---

Keep colouring an ICU message after a misspelled argument kind. `tokenizeTemplate` marked nothing after an argument kind it did not know, so an editor lost the colour of the branches, `#` and styles of a message the moment `plural`, `number` or another kind was misspelled. The word in the kind position is marked as the keyword and the branches and styles after it are marked as before; the diagnostic still reports the unknown kind.
