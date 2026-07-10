# @yapyak/e2e

> Internal

End-to-end tests for the `examples/*` apps. Playwright boots every example's dev server and verifies rendering, locale switching, and persistence in a real browser.

## Run

```sh
pnpm e2e
```

First run on a machine needs the browser binary:

```sh
pnpm --filter @yapyak/e2e exec playwright install chromium
```

## Adding an example

Add one entry to `EXAMPLES` in [playwright.config.ts](playwright.config.ts): the example's directory name, the next free port, its `persistence` kind, and whether it has a second server-driven switch group. The shared spec derives everything else — the app must render the same content as the existing examples.
