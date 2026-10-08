---
'@yapyak/vite': patch
---

Leave the translations of a source file that does not parse untouched. The dev server kept a file's previous messages while it failed to parse, but a file that already failed when the server started had none, so the save loop moved its translations to the orphan cache until the file parsed again. The save loop now leaves the translations of every file that failed to parse on its last read in place.
