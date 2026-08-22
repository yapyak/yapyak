---
'yapyak': patch
---

Export a `TextDirection` type naming the `'ltr' | 'rtl'` union that `getTextDirection()` returns. Annotating a variable or parameter that holds a text direction meant retyping the bare union; the return type now carries the name instead.
