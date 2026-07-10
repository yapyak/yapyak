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
