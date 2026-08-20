# @yapyak/e2e

> Internal

End-to-end tests for the `examples/*` apps. Playwright boots every example and verifies rendering, locale switching, and persistence in a real browser. The same spec runs in two modes: `dev` exercises the dev servers and the on-the-fly transform; `prod` builds every example and exercises the compiled output on its production server.

## Run

```sh
pnpm e2e:dev
pnpm e2e:prod
```

First run on a machine needs the browser binary:

```sh
pnpm --filter @yapyak/e2e exec playwright install chromium
```

## Save-loop promises

[save-loop.spec.ts](src/save-loop.spec.ts) runs against [sandbox/](sandbox/) (dev mode only) and proves the documented save-loop promises one-to-one. Editing a promise in the guides means updating its test here — this table is the sync point.

| Documented promise | Source | Test |
| --- | --- | --- |
| "empty stubs are filled on save" and the module hot-replaces without a reload | [hmr.md](../docs/content/guide/advanced/hmr.md) | `writes the translation when a new t() call is saved` |
| "Component state — open dialogs, controlled form inputs, scroll position — stays put" | [hmr.md](../docs/content/guide/advanced/hmr.md) | `preserves the input value when the source is saved` |
| "The string renders in your source language immediately … the model translates it" a moment later | [hmr.md](../docs/content/guide/advanced/hmr.md) | `falls back to the source string until the translation arrives` |
| `t.as()` homonyms get per-context catalog entries | [homonyms.md](../docs/content/guide/writing/homonyms.md) | `writes both context translations when t.as() homonyms are saved` |
| "Same path, edited source string" keeps the translation with `preserveTranslationsOnSourceEdit` | [renames.md](../docs/content/guide/translating/renames.md) | `preserves the translation when a source string is edited in place` |
| "Same source, deleted then re-added" restores from the orphan cache | [renames.md](../docs/content/guide/translating/renames.md) | `preserves the translation when a removed t() call returns` |
| "Same source, new path" restores under the new file path | [renames.md](../docs/content/guide/translating/renames.md) | `preserves the translation when the source file moves` |
| A save past `autoTranslateThreshold` "writes the empty stubs and logs that the translator was skipped" | [loop.md](../docs/content/guide/translating/loop.md) | `skips auto-translate when a save exceeds autoTranslateThreshold` |
| "Run `yapyak translate` when you're ready" fills the skipped stubs | [coverage.md](../docs/content/guide/translating/coverage.md) | `writes the skipped translations when yapyak translate runs` |
| A hand-edit to `locales/sv.json` reaches the browser "within the same render cycle" | [hmr.md](../docs/content/guide/advanced/hmr.md) | `renders the translation when the catalog is edited by hand` |
| "Existing translations are never overwritten" | [llms.txt instructions](../docs/vite.config.ts) | `preserves a hand-edited translation when the source is saved again` |
| A syntax error in `locales/sv.json` blocks the swap without killing the loop | [hmr.md](../docs/content/guide/advanced/hmr.md) | `renders the translation when a broken catalog save is fixed` |
| `yapyak add <locale>` "fills every existing source string in one run" | [coverage.md](../docs/content/guide/translating/coverage.md) | `writes every translation when yapyak add runs` |

## Adding an example

Add one entry to `EXAMPLES` in [playwright.config.ts](playwright.config.ts): the example's directory name, the next free port, its `persistence` kind, its prod serve script (`preview` or `start`), and whether it has a second server-driven switch group. The shared spec derives everything else — the app must render the same content as the existing examples.
