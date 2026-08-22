---
'yapyak': patch
---

Drop the template re-exports from `yapyak/compiler/internal`. `parseTemplate`, `tokenizeTemplate` and the `Template`, `TemplateToken` and `TemplateTokenKind` types were reachable from both that entry and `yapyak/template/internal`; they now live at the template entry alone.
