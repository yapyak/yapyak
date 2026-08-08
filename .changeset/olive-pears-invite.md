---
'yapyak': patch
---

`Fragment` carries `segments` instead of `originalOffset`. A segment maps one run of fragment code back to the source file it was taken from, so a processor can emit code that is not a verbatim slice of the file.

A custom processor replaces `originalOffset: start` with `segments: segmentsFromOffset(code, start)`. The `segmentsFromOffset` function and the `FragmentSegment` type are exported from `yapyak/processor`.
