---
name: yapyak-box
description: "The Box primitive: render Box for every content element, BoxProps<T>, data-* passthrough, className forwarding, the SVG-leaf and document-shell exceptions. Use when writing component or route JSX markup."
---

### Always render `Box` for every HTML element

**Every** content element — `<div>`, `<h1>`, `<p>`, `<span>`, `<button>`, etc. — in component code **and route-file markup** becomes `<Box as="...">`. Not just the root — every element.

Raw exceptions: the **document shell** (`<html>`, `<head>`, `<body>`, `<title>`, `<meta>`, `<link>`, `<base>`, `<script>`, in `__root`) and the **SVG leaf** (below).

```tsx
// ✓ Right — Box everywhere
<Box>
  <Box as="h2" className={styles.HeadingText}>{title}</Box>
  <Box as="p" className={styles.Description}>{description}</Box>
</Box>

// ✗ Wrong — mixing Box and raw HTML
<Box>
  <h2 className={styles.HeadingText}>{title}</h2>
  <p className={styles.Description}>{description}</p>
</Box>
```

### SVG leaf components

A component whose root *and entire body* is one `<svg>` (a leaf icon — `Icon` in [[yapyak-element-type]]) renders raw `<svg>` with `SVGProps<SVGSVGElement>` and spreads `{...props}` directly. An `<svg>` nested inside other elements is `<Box as="svg">` like anything else.

```tsx
export function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 16 16">
      <path d="..." />
    </svg>
  );
}
```

### Component shape — `<div>` default

Props follow React/HTML attribute conventions — **no `is*` prefix on boolean props**. The prefix lives on internal state, not on the public component API.

```tsx
import type { BoxProps } from '#components/box';
import { Box } from '#components/box';
import styles from './card.module.css';

export type CardProps = BoxProps & {
  elevated?: boolean;
};

export function Card(props: CardProps) {
  const { className, elevated, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.Card, className]}
      data-elevated={elevated}
    />
  );
}
```

No `<'div'>`, no `as="div"`, no `children` destructuring, self-closing — defaults all the way down.

### Component shape — non-div root

```tsx
export type ButtonProps = BoxProps<'button'> & {
  disabled?: boolean;
  pressed?: boolean;
};

export function Button(props: ButtonProps) {
  const { className, disabled, pressed, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="button"
      className={[styles.Button, className]}
      data-disabled={disabled}
      data-pressed={pressed}
      disabled={disabled}
    />
  );
}
```

### Box rules

| Rule | Detail |
|---|---|
| `children` — don't destructure | `children` flows through `...restProps`. Self-close `<Box />` instead of `<Box>{children}</Box>`. Destructure only when you wrap, transform, or render them alongside other content. |
| `className` always forwarded | Destructure consumer `className` and pass it along: `className={[styles.Button, className]}`. Never `className={styles.Button}` alone. Never use `cn()`, `clsx`, template strings, or ternaries to merge — Box does it. |
| Control props pass through to native | `disabled` → both `data-disabled={disabled}` (CSS) AND `disabled={disabled}` (native behavior). |
| `data-*` attributes pass through directly | Box normalizes booleans → empty string / undefined. Write `data-pressed={pressed}`, never `data-pressed={pressed \|\| undefined}`. |
| `<div>` root is implicit | Write `extends BoxProps` (not `BoxProps<'div'>`) and omit `as="div"`. |
| Non-`div` roots are explicit | `BoxProps<'button'>` + `as="button"`, `BoxProps<'a'>` + `as="a"`, etc. |
| Props extend `BoxProps<T>` | `T` is the root element. Never write a standalone props interface. |
| Spread `...restProps` first on `Box` | Explicit props (className, data-*, as) declared after the spread always win. |

### `className` on styled components

A styled component (`Button`, `Badge`, `Link`) accepts `className` **only for cross-component layout** — position, margin, or grid-placement passed from a parent per [[yapyak-css]]. Never use `className` to change its **appearance** (color, size, typography); add a variant (`size`, `appearance`, `intent`) instead. If the customization is reusable, add a variant to the component; if it is a one-off structural need, drop to a base primitive. Appearance via `className` means the component API is incomplete.

### Never pass explicit generic type arguments in JSX

```tsx
// ✗ Wrong
<Box<'input'> />
<List<User> />

// ✓ Right — generic inferred from as= or other props
<Box as="input" />
<List items={users} />
```

If inference fails, the component's type definition is wrong — fix it there, not at the call site.
