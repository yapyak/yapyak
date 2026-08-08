---
'yapyak': patch
---

`parseSource` returns `{ fragments }` instead of a fragment array. A custom processor wraps its fragment array in the result object: `parseSource: (source) => ({ fragments })`. The `ParseSourceResult` type is exported from `yapyak/processor`.
