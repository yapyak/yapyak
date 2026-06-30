---
name: yapyak-app
description: "App-code TypeScript: infer return types (no isolatedDeclarations), domain null vs UI undefined translated at the dispatcher, browser-side window.* timers. Use when writing app code under docs/."
---

### TypeScript config

- Extend the workspace's `app` tsconfig preset (no `isolatedDeclarations`).
- **Let TypeScript infer return types.** Don't annotate.

```tsx
// ✓ App code — inference
export function Button(props: ButtonProps) {
  const { className, ...restProps } = props;

  return <Box {...restProps} className={[styles.Button, className]} />;
}

// ✗ App code — unnecessary annotation
export function Button(props: ButtonProps): ReactElement {
  // ...
}
```

**Annotate only when required:**

Annotate the return type only when one holds: (a) omitting it produces a TypeScript error at a call site; (b) the function is exported across a package boundary AND inference widens the return to include an internal type that should not surface publicly; (c) the function is generic and inference does not preserve the type-parameter relation in the return. Otherwise — if it compiles and callers are satisfied — do not annotate.

### Domain vs UI — `null` vs `undefined`

Apps have two layers with two different conventions. **Never mix them.**

**Domain types use `null` for missing optional values.** Treat parsed/loaded content as if it came from a backend. Stable shape (the field is always present), explicit "intentionally absent" semantics, serializable to JSON. This applies to everything in route loaders, parsed content, and any data you'd cache or send over a wire.

```ts
// ✓ Domain
type CalloutBlock = {
  type: "callout";
  title: string | null; // stable shape, null = author didn't provide
  variant: CalloutVariant;
  children: Block[];
};
```

**UI components use `?:` optional fields.** React-idiomatic, `undefined` for missing. Components are vanilla React building blocks — they don't know about domain conventions, and they don't accept `null` in their props.

```ts
// ✓ UI
type CalloutProps = BoxProps<"aside"> & {
  title?: string; // optional, undefined when omitted
  variant: CalloutVariant;
};
```

**The conversion lives inline at the dispatcher node** — the boundary between the two layers. Per-prop `?? undefined` translates domain-null to UI-undefined. **Never hide this in adapter functions**; the visible `?? undefined` IS the layer-boundary marker.

```tsx
// ✓ Dispatcher node — translation visible at the boundary
<Callout title={block.title ?? undefined} variant={block.variant}>
  ...
</Callout>
```

**Display defaults belong in the UI, not in the dispatcher.** If a callout has no title, the `Callout` component decides what to show (e.g. capitalized variant name). The dispatcher only translates absence; it doesn't invent display values.

## TypeScript — client

Browser-only code — not Node, CLIs, or isomorphic code.

### Timers — `window.*` only

Always call `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `requestAnimationFrame`, `cancelAnimationFrame` on `window`:

```ts
// ✓
window.setTimeout(fn, 100);
window.requestAnimationFrame(fn);

// ✗
setTimeout(fn, 100);
requestAnimationFrame(fn);
```
