---
'@yapyak/astro': patch
---

Supply the enclosing attribute name from template attributes. A `t()` call in an attribute expression — `title={t('Save changes')}` — now carries `title` as call-site context; element content carries nothing.
