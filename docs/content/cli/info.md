---
title: info
order: 8
---

```bash
yapyak info
```

Prints the environment a bug report needs: the running yapyak version, the Node version, the operating system, the package manager, and the project's yapyak packages, Vite, and TypeScript with the versions installed in `node_modules`.

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak info
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak info
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak info
```
{% /when %}
{% /switch %}

```terminal
  <b>Environment</b>
  <d>Node</d>              v24.10.0
  <d>System</d>            darwin 25.6.0 (arm64)
  <d>Package manager</d>   pnpm 11.11.0

  <b>Packages</b>
    yapyak          0.1.0
    @yapyak/react   0.1.0
    @yapyak/vite    0.1.0
    typescript      6.0.3
    vite            8.1.5
```

The output contains no file paths and no usernames. Paste it into a bug report as-is.

`info` runs without `yapyak.config.ts` — it works in a project where the config is the thing that's broken.

## Resolution

The `yapyak` row is the version of the CLI itself — the one `npx` resolved and ran. The scoped rows come from the yapyak packages declared in the current directory's `package.json`, and every version resolves from `node_modules` with an upward walk, the way Node does. Vite and TypeScript resolve through that walk even with no declaration in the current directory, since a workspace leaf rarely declares its own TypeScript. Run it from the app or package that shows the problem. A declared package that isn't installed is listed with its declared range and `(not installed)`.

## Exit codes

Always `0`. `info` reports; it never gates.
