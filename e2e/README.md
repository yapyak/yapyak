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

## Adding an example

Add one entry to `EXAMPLES` in [playwright.config.ts](playwright.config.ts): the example's directory name, the next free port, its `persistence` kind, its prod serve script (`preview` or `start`), and whether it has a second server-driven switch group. The shared spec derives everything else — the app must render the same content as the existing examples.
