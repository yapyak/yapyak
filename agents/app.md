## TypeScript — app

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

- The function returns multiple unrelated branches that TS infers too loosely
- A specific generic signature can't otherwise be expressed
- The inferred type leaks an internal type alias that shouldn't be public

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

**The conversion lives inline at the dispatcher node** — the boundary between the two layers. Per-prop `?? undefined` translates domain-null to UI-undefined. **Don't hide this in adapter functions**; the visible `?? undefined` IS the layer-boundary marker.

```tsx
// ✓ Dispatcher node — translation visible at the boundary
<Callout title={block.title ?? undefined} variant={block.variant}>
  ...
</Callout>
```

**Display defaults belong in the UI, not in the dispatcher.** If a callout has no title, the `Callout` component decides what to show (e.g. capitalized variant name). The dispatcher only translates absence; it doesn't invent display values.
