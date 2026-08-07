---
'@yapyak/astro': patch
---

A `t()` call that follows an element in the same expression is extracted and rewritten. `<p>{flag ? <b>{t('Hello')}</b> : t('Cancel')}</p>` dropped the second call, left it in the built page, and removed the `yapyak` import it still needed.
