# Releasing

How yapyak is versioned and published. Driven by
[Changesets](https://github.com/changesets/changesets), publishing to npm via GitHub
Actions [OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers/) — no
`NPM_TOKEN`, with provenance on every package.

## Versioning model: lockstep

Every publishable package shares one version and is released together (Changesets
`fixed`). This is deliberate: the framework adapters and translator providers import 50+
times from `yapyak`'s semi-public `/internal` surfaces, which carry no cross-version
stability guarantee. Lockstep guarantees an adapter at version `X` always has a matching
`yapyak@X` — which is exactly what the exact-pin peer (`"yapyak": "workspace:*"`, published
as `=X`) already assumes.

Do not switch to independent versioning without first stabilising the `/internal` contracts.

## The tools

All dev-only. None of this ships to users.

| Tool | Purpose |
| --- | --- |
| `@changesets/cli` | Versioning + changelog engine. `pnpm changeset` records intent; the CI action bumps + publishes. |
| `@changesets/changelog-github` | Turns changeset notes into GitHub-linked `CHANGELOG.md` + release notes. |
| `publint` | Validates each package's publish config (`exports`, `files`, `types`) against the packed tarball. |
| `@arethetypeswrong/core` (`attw`) | Validates that published types resolve across module modes (`esm-only` profile). |

`publint` + `attw` run **automatically on every `pnpm build`**, wired into `tsdown` via
the shared `@yapyak/tsdown-config`. No separate command, no per-package scripts. Private
packages are auto-detected and skipped (they are never published).

```bash
pnpm build   # builds + validates every publishable package
```

> `@yapyak/astro` and `@yapyak/svelte` set `attw.ignoreRules: ['internal-resolution-error']`
> in their own `tsdown.config.ts`: their `.` entry ships raw `.astro` / `.svelte` source
> (bundler-target by design), which Node16 pure-ESM cannot resolve. Their `bundler`
> resolution is green.

## Everyday flow (once launched)

Commit messages **do not drive releases** — only `.changeset/*.md` files do. Message style follows `yapyak-commit` in `.agents/skills/`.

1. For each user-facing change, run:
   ```bash
   pnpm changeset
   ```
   Pick the bump (patch / minor / major) and write the release note. It creates a
   `.changeset/*.md` file — **that file body is the changelog entry.** Commit it with your
   change. Because of lockstep, one changeset bumps all packages to the same version.
2. On push to `main`, `changesets/action` opens/updates a **"Version Packages" PR** that
   consumes the changesets, bumps every package, and writes each `CHANGELOG.md` from your
   notes. It keeps updating as you add more changesets.
3. Review it — it shows the exact version and full changelog that will ship.
4. **Merge the Version PR** to release. The workflow builds, runs `publint` + `attw`, and
   publishes every package via OIDC with provenance.

### Where you write release notes

In the `.changeset/*.md` file body. Write a one-liner in the `pnpm changeset` prompt, or
open the generated file and expand it into full prose (paragraphs, lists, code) any time
before you release. Last-chance edits can be made to `CHANGELOG.md` in the Version PR.

You control cadence: merge the Version PR immediately for continuous releases, or let
changesets accumulate and ship weekly. No changesets = no PR = silent.

## Breaking changes (pre-1.0)

Every changeset declares `patch` — `scripts/verify-changesets.mjs` and the CI
`changesets` job enforce it. With `workspace:*` peers a `minor` escalates every peer
dependent to `major` and the fixed group with it, at any version, so the version number
cannot signal a break. The signal lives in two places instead:

1. **The changeset text** carries the change and the reason.
2. **[BREAKING.md](BREAKING.md)** carries the migration: before/after code and the
   steps. The entry lands **in the same change that introduces the break** — never at
   release time — under the version that ships it. Patch-only releases make that
   version the next patch; confirm the heading against the Version Packages PR before
   merging, and bump it if a release landed in between.

This regime ends with the 1.0 graduation, in one change (see `yapyak-package`
§ Changeset bumps): switch the `yapyak` peer to `workspace:^`, set
`onlyUpdatePeerDependentsWhenOutOfRange: true`, and remove the guard script with its CI
job. From 1.0 breaking changes follow semantic versioning — major releases only — and a
dedicated changelog takes over; BREAKING.md is frozen.

## First-time launch runbook

The scaffolding is committed but **dormant** until these steps. Until then, commit freely;
nothing is enforced and nothing publishes.

### 1. Reset git history (optional)

```bash
git checkout --orphan fresh
git add -A
git commit -m "initial public release"
git branch -D main && git branch -m main
git push -f origin main
```

### 2. Activate the release workflow

In `.github/workflows/release.yml`, replace:

```yaml
on:
  workflow_dispatch:
```

with:

```yaml
on:
  push:
    branches: [main]
```

### 3. GitHub settings

- Settings → Actions → General → enable **"Allow GitHub Actions to create and approve pull requests"** (Changesets needs it to open the Version PR).
- Make the repository **public** (required for provenance attestations).

### 4. Set the first version + first publish (one-time, token-based)

OIDC cannot publish a package's *first* version — npm needs the package to exist before you
can configure trusted publishing. So publish once with a token:

```bash
# choose the baseline: a `minor` changeset -> 0.1.0, a `major` changeset -> 1.0.0
pnpm changeset            # write the "initial release" note
pnpm changeset version    # bumps all packages from 0.0.0; needs GITHUB_TOKEN set locally
npm config set //registry.npmjs.org/:_authToken=<granular-token>
pnpm build
pnpm typecheck
pnpm test
pnpm -r publish --access public --no-git-checks
```

Use an npm granular access token scoped to `@yapyak` + `yapyak` with read/write.

### 5. Switch to OIDC for all future releases

On each package's `npmjs.com/package/<name>/access` → **Trusted Publisher**:

- Organization/user: `yapyak`
- Repository: `yapyak`
- Workflow filename: `release.yml`
- Environment: *(leave blank)*
- Tick the **"npm publish"** allowed action (required for configs created after 2026-05-20).

Then delete the temporary token (npm site and local `.npmrc`). From here every release is
OIDC-only with automatic provenance — just `pnpm changeset` and merge the Version PR.

## Dry-run the whole thing privately (Verdaccio)

To prove the publish→install loop without touching the public registry:

```bash
pnpm dlx verdaccio            # starts a local registry on http://localhost:4873
pnpm -r publish --registry http://localhost:4873 --no-git-checks
# then install the packages in a scratch app and confirm workspace:* rewrote to a real version
```
