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

Bump catalog versions with `pnpm update --latest -r <pkg…>` — hand-editing `pnpm-workspace.yaml` is forbidden outside mismatch step 2 below. Adding a new dependency uses `pnpm add` per [[yapyak-package]] § In a pnpm monorepo.

`ERR_PNPM_CATALOG_VERSION_MISMATCH` on a bump means the package is declared both as `catalog:` and as a non-catalog peer range in the same workspace package ([pnpm#9900](https://github.com/pnpm/pnpm/issues/9900)) → escalate in order:

1. Bump through a peer-free consumer: `pnpm --filter <project> update --latest <pkg>`, where `<project>` references the package only via `catalog:`.
2. No peer-free consumer exists → hand-edit the catalog entry and run `pnpm install` in the same change. Delete this step when pnpm#9900 closes.

A `@biomejs/biome` bump leaves the `biome.json` `$schema` on the old version → run `pnpm exec biome migrate --write` in the same change.

### Holds

- Every hold has a row below AND its name in `pnpm-workspace.yaml` `updateConfig.ignoreDependencies` — add or remove both in the same commit.
- Held packages vanish from `pnpm outdated` → re-test every "Re-test when" condition during each bump round.
- Never encode a hold as a catalog comment → pnpm re-sorts the catalog and the comment drifts onto the wrong entry.

| Package | Hold | Why | Re-test when |
| --- | --- | --- | --- |
| `typescript` | 6.x | TS 7's native compiler drops the JS compiler API `@yapyak/docs-compiler` calls | TS 7 ships a JS compiler API, or doc-compiler stops needing one |

### Release-age gate

- Keep `minimumReleaseAge: 10080` (minutes) in `pnpm-workspace.yaml` — versions younger than 7 days resolve to the newest older release.
- Keep `trustLockfile: true` — without it pnpm re-verifies every lockfile entry against the gate and CI fails on entries younger than the cutoff.
- Exempt a package that must land sooner via `minimumReleaseAgeExclude` → remove the exemption in the next bump round.

### Build scripts

A dependency demanding a build script fails install with `ERR_PNPM_IGNORED_BUILDS` → add it under `allowBuilds` in `pnpm-workspace.yaml`, `false` unless the package is broken without its script.

### Tool floors

Bump a floor in every listed location in one commit.

| Floor | Bump by editing |
| --- | --- |
| pnpm | `packageManager` in root `package.json` — corepack and `pnpm/action-setup` read it |
| Node | every `engines` field, the `ci.yml` matrix, `docs/content/guide/getting-started/installation.md`, the [[yapyak-package]] `engines` example |
