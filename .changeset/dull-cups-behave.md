---
"yapyak": patch
---

Write the progress of a translation run to `.yapyak/progress.json`, so editors can show it. The dev server, `yapyak translate`, `yapyak retranslate` and `yapyak add` all record when the run started, how many translations it will write, how many are written so far, and every one that failed, then mark the run finished. `readTranslationProgress` and `isTranslationRunning` from `yapyak/compiler/internal` read the file back; a run whose process has exited no longer counts as running.
