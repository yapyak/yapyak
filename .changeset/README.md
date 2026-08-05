# Changesets

This folder is managed by [`@changesets/cli`](https://github.com/changesets/changesets).

Every user-facing change gets a changeset: run `pnpm changeset`, pick the bump
(patch / minor / major), and write the release note. The generated `.md` file **is**
the changelog entry — commit it alongside your change. All yapyak packages are
released in lockstep, so one changeset bumps them all to the same version.

See [`RELEASING.md`](../RELEASING.md) for the full flow.
