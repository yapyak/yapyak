---
name: yapyak-ci
description: "CI workflows: the action-pinning rule, SHA resolution, permissions, job invariants. Use when editing a workflow under `.github/workflows/`."
---

### Action pinning

Pin every action to a full commit SHA with an exact-version comment.

```yaml
# ✓ Full SHA, exact-version comment
- uses: changesets/action@a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d # v1.9.0
# ✗ Tag or branch — repointable by the action's owner
- uses: changesets/action@v1
```

Never pin an action to a tag, branch, or shortened SHA → resolve the full commit SHA with the algorithm below.

#### Resolving a SHA

1. `git ls-remote https://github.com/<owner>/<repo> 'refs/tags/v*'` — pick the highest stable tag.
2. Take the SHA on the `^{}` (dereferenced) line for that tag; when no `^{}` line exists, the tag line's SHA is the commit.
3. Write `<owner>/<repo>@<sha> # <exact tag>`.

Bump action SHAs by hand with the same algorithm — dependency-bot configuration is forbidden per [[yapyak-dependency]].

### Permissions

Declare a `permissions:` block in every workflow.

| Workflow | Grants |
| --- | --- |
| `ci.yml` | `contents: read` |
| `release.yml` | `contents: write`, `id-token: write`, `pull-requests: write` |

### Job invariants

- Install with `pnpm install --frozen-lockfile`.
- Set `timeout-minutes` on every job.
- Add every new `ci.yml` job to `all-green`'s `needs` list.
