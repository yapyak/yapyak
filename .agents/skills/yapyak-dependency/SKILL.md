---
name: yapyak-dependency
description: "Dependency updates: the bump routine, holds, the release-age gate, tool floors. Use when bumping a dependency, pnpm, or Node, or adding version-management config."
---

### The bump routine

Never add dependabot or renovate configuration → run this routine. Action SHAs follow [[yapyak-ci]] § Action pinning.

1. `pnpm -r outdated` — exit ≠ 0 means bump candidates exist.
2. Drop every package in the Holds table from the candidates.
3. Bump patch + minor candidates in one batch: `pnpm update --latest -r <pkg…>`.
4. Bump each major alone: read its changelog first, then re-verify every `peerDependencies` floor naming the package and grep `docs/content` for version mentions.
5. Verify per [[yapyak-workflow]] § Verify after changes, then `pnpm e2e:dev` and `pnpm e2e:prod`.
6. Commit `pnpm-workspace.yaml` and `pnpm-lock.yaml` together — CI's frozen install rejects a catalog that doesn't match the lockfile.

Bump catalog versions with `pnpm update --latest -r <pkg…>` — never by hand-editing `pnpm-workspace.yaml`. Adding a new dependency uses `pnpm add` per [[yapyak-package]] § In a pnpm monorepo.

### Holds

- Every hold has a row below AND its name in root `package.json` `pnpm.updateConfig.ignoreDependencies` — add or remove both in the same commit.
- Held packages vanish from `pnpm outdated` → re-test every "Re-test when" condition during each bump round.
- Never encode a hold as a catalog comment → pnpm re-sorts the catalog and the comment drifts onto the wrong entry.

| Package | Hold | Why | Re-test when |
| --- | --- | --- | --- |
| `typescript` | 6.x | TS 7's native compiler drops the JS compiler API `@yapyak/doc-compiler` calls | TS 7 ships a JS compiler API, or doc-compiler stops needing one |

### Release-age gate

- Keep `minimumReleaseAge: 10080` (minutes) in `pnpm-workspace.yaml` — versions younger than 7 days resolve to the newest older release.
- Exempt a package that must land sooner via `minimumReleaseAgeExclude` → remove the exemption in the next bump round.

### Tool floors

Bump a floor in every listed location in one commit.

| Floor | Bump by editing |
| --- | --- |
| pnpm | `packageManager` in root `package.json` — corepack and `pnpm/action-setup` read it |
| Node | every `engines` field, the `ci.yml` matrix, `docs/content/guide/getting-started/installation.md`, the [[yapyak-package]] `engines` example |
