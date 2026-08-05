---
name: yapyak-commit
description: "Commit messages: the area-prefix form, the closed area table, subject and body rules, the push ban. Use when writing a git commit message or asked to commit."
---

### Form

`<area>: <subject>` — one space after the colon, nothing before the area.

### Area — derive from the changed paths

| Path prefix | Area |
| --- | --- |
| `packages/<dir>/` | `<dir>` |
| `docs/` | `docs` |
| `e2e/` | `e2e` |
| `examples/` | `examples` |
| `.agents/` | `skills` |
| `.github/workflows/` | `ci` |
| anything else | `repo` |

2+ areas in one commit → the area with the most changed files; tie → `repo`.

### Subject

- Imperative present, lowercase first letter. Code identifiers keep their casing.
- No trailing period.
- Whole line ≤ 72 characters; aim for ≤ 50.

```
✓ yapyak: silence warnings in production browser bundles
✓ e2e: fail prod runs on yapyak console output
✗ Fixed prod warnings          (past tense, no area)
✗ yapyak: Add info command.    (capitalized, trailing period)
```

### Body

- Add a body iff the why is not visible in the diff; wrap at 72.
- Never restate a changeset note — `.changeset/*.md` carries the user-facing entry.
- Attribution trailers are forbidden — commits carry the author's own identity.

### Push

Never run `git push` — the user pushes manually.
