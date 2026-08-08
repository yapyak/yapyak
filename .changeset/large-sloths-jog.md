---
'yapyak': patch
---

The processor's `parseFragments` hook is renamed to `parseSource`. The old name read as if fragments were the input; every other `parse*` function in yapyak names the thing being parsed. A custom processor renames the hook, and the `ParseSourceFn` type replaces `ParseFragmentsFn`.
