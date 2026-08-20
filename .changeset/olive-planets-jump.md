---
'yapyak': patch
---

Send the enclosing attribute name as call-site context. A `t()` call whose value sits in an attribute — `aria-label={t('Pause')}`, `placeholder={t('Search')}` — sent nothing that said so, and the model translated the string as visible copy even though attribute text follows other conventions. At context `'minimal'` and `'rich'` the request now carries `attribute` with the attribute name as written; the field is absent when the call sits in element content. Framework processors supply the name through the new optional `enclosingAttribute` fragment field.
