---
'@yapyak/astro': patch
---

A `t()` call inside a frontmatter JSX element is extracted and rewritten. Frontmatter parsed as plain TypeScript, so `const banner = <p>{t('Hello')}</p>;` read as a type assertion and the call was silently skipped.
