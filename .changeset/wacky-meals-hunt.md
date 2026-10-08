---
'yapyak': patch
---

Compile a `t()` call whose params use quoted keys to a template literal in fixed-locale builds. Only unquoted keys counted as static, so a call such as `t('Hi {name}', { 'name': user })` kept its runtime lookup. It now compiles to the same template literal as the call with an unquoted key.
