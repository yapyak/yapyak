---
'yapyak': patch
---

A `t()` call that shares its attribute or interpolation with other code is replaced in place instead of eliding the whole container. At a single locale `<div :title="t('Hello') + x">` dropped `+ x`, and two calls in one interpolation kept only the last.
