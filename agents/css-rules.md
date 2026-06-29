## CSS — rules

### Cascade layer

All component/route CSS is wrapped in `@layer components`. Lets design tokens and resets sit in their own layers without specificity wars.

### Use design tokens, never hardcoded values

```css
/* ✓ */
padding: var(--spacing-4);
border: 1px solid var(--rule);
color: var(--intent-danger);

/* ✗ */
padding: 16px;
border: 1px solid #e6e6e6;
color: #d23030;
```

If a needed value doesn't have a token, add the token to the design-token layer first, then use it.

### Never reset element defaults in component CSS

The global reset (under `@layer reset`) strips browser defaults. Typical resets handled:

| Element / Property | What's reset |
|---|---|
| `*, *::before, *::after` | `box-sizing: border-box`, `margin: 0`, `padding: 0` |
| `ul`, `ol` | `list-style: none` |
| `a` | `color: inherit`, `text-decoration: none` |
| `button` | `font: inherit`, `color: inherit`, `cursor: pointer`, `background: none`, `border: 0` |
| `input`, `textarea`, `select` | `font: inherit` |
| `img`, `video`, `svg` | `display: block`, `max-width: 100%` |
| `h1`–`h6` | `font-size: inherit`, `font-weight: inherit` |
| `th` | `text-align: left` |

Never write any of these properties in a component CSS to "reset" them — the reset already did. If a property looks like a reset, ask: would the element have this anyway? If yes → delete. If no → it's component-specific styling and belongs.

If a new reset is needed broadly, add it to the global reset file — not per-component.

### Never write vendor prefixes

Build pipeline auto-prefixes via Lightning CSS based on browserslist targets. Write the standard property only:

```css
/* ✓ */
user-select: none;
appearance: none;

/* ✗ — manual prefixes, dead code */
-webkit-user-select: none;
-moz-appearance: none;
```

### Prefer `flex` / `grid` + `gap` over `margin`

Default to gap when laying out siblings — restructure the parent into a flex/grid container when possible.

Use `margin` only when gap can't express the spacing cleanly (asymmetric per-child spacing, non-uniform offsets between specific siblings, or when adding a parent flex container would cascade unwanted side-effects).

When you reach for margin, make sure it's because gap genuinely doesn't fit — not because you skipped restructuring.

### TOTALLY FORBIDDEN: `flex-grow`, `flex-shrink`, `flex-basis`

Always use the `flex` shorthand. No exceptions.

```css
/* ✗ Wrong */
flex-shrink: 0;
flex-grow: 1;
flex-basis: 0;

/* ✓ Right — common cases */
flex: none;       /* don't grow, don't shrink, basis auto (= 0 0 auto) */
flex: 1;          /* grow, shrink, basis 0 (greedy fill) */
flex: 0 0 auto;   /* don't grow, don't shrink, basis auto (explicit) */
flex: 1 0 auto;   /* grow, don't shrink, basis auto */
flex: auto;       /* grow, shrink, basis auto (= 1 1 auto) */
```

### Never leave unnecessary properties

Every property must pay for itself. Common dead properties to prune:

- `display: inline-block` on a flex/grid item (flex/grid overrides it)
- `width: 100%` on a block element that already fills its container
- Redundant `color` matching the inherited value
- `margin: 0` on an element that has no default margin
- `overflow: hidden` when nothing overflows
- Duplicate properties across sibling rules that could be merged

### Use `background-color`, not `background` shorthand

Unless you're setting multiple background properties (image + position + repeat), use the specific property:

```css
/* ✓ */
background-color: var(--surface);

/* ✗ — shorthand resets everything else */
background: var(--surface);
```

### Nesting is for structure and state only

Child elements are nested (mirroring DOM). Pseudo-classes and data attributes are nested. Other top-level rules are not.

### Always wrap `:hover` in `@media (hover: hover)`

Bare `:hover` styles "stick" on touch devices: after a tap, the hover stays until something else is tapped. Always gate hover styles behind `@media (hover: hover)` so touch devices skip them entirely and only `:active` drives feedback.

```css
/* ✓ Right */
.Button {
  background-color: var(--surface);
  transition: background-color var(--transition);

  @media (hover: hover) {
    &:hover {
      background-color: var(--surface-strong);
    }
  }

  &:active {
    transform: scale(0.96);
  }
}

/* ✗ Wrong — sticky hover on iOS/Android */
.Button {
  &:hover {
    background-color: var(--surface-strong);
  }
}
```

`:focus-visible` and `:active` are **not** wrapped — they work the same across input modalities.

### Every interactive element needs an `:active` state

Because `:hover` is now gated behind `@media (hover: hover)`, touch devices skip hover styles entirely. Without `:active`, a tap produces zero visual feedback — feels broken.

If an element has `:hover` (now always wrapped), it MUST also have `:active`. And any element without a hover style still needs an `:active` if it's clickable/tappable at all.

```css
/* ✓ Right — hover for desktop, active for everyone */
.Button {
  @media (hover: hover) {
    &:hover {
      background-color: var(--surface-strong);
    }
  }

  &:active {
    transform: scale(0.96);
  }
}

/* ✗ Wrong — touch users get no feedback */
.Button {
  @media (hover: hover) {
    &:hover {
      background-color: var(--surface-strong);
    }
  }
}
```

The typical `:active` is `transform: scale(0.96)` for solid buttons or a subtle color/opacity shift for text-style controls.

### Gate state effects behind `&:enabled` for disablable elements

Elements that support the native `disabled` attribute (`<button>`, `<input>`, `<textarea>`, `<select>`) must wrap their `:hover`/`:active`/`:focus-visible` styles in `&:enabled` so disabled instances don't react to interaction.

```css
/* ✓ Right */
.Button {
  transition:
    background-color var(--transition),
    transform var(--transition);

  &:enabled {
    @media (hover: hover) {
      &:hover {
        background-color: var(--surface-strong);
      }
    }

    &:active {
      transform: scale(0.96);
    }

    &:focus-visible {
      outline-width: 4px;
      outline-color: var(--accent-soft);
    }
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

/* ✗ Wrong — disabled button still bounces on tap */
.Button {
  &:hover { background-color: var(--surface-strong); }
  &:active { transform: scale(0.96); }
  &:disabled { opacity: 0.4; }
}
```

Use the native `disabled` HTML attribute, not a `data-disabled` attribute. `:enabled`/`:disabled` only work with the native attribute and they also flip ARIA semantics correctly for free.

Anchor (`<a>`) elements can't be `:disabled` — they're either rendered as links or not. No `:enabled` wrap needed there.

### Mobile-first responsive

One layout-shift breakpoint: `min-width: 1024px` — threshold where layouts shift from mobile (stacked, 1-col) to desktop (multi-col).

Mobile-first. Default CSS targets mobile. `@media (min-width: 1024px)` enhances for desktop. Never use `max-width` queries — they invert the model and lead to harder-to-maintain stylesheets.

```css
/* ✓ mobile-first */
.Component {
  grid-template-columns: 1fr;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
}

/* ✗ desktop-first — don't */
.Component {
  grid-template-columns: 1fr 1fr;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}
```

If a different threshold is needed for a specific component (rare), document why. Generally everything that shifts between mobile and desktop uses 1024px.

### Length units — `px` for layout, `rem` only for font-size

`rem` is reserved for `font-size` declarations and font-size design tokens (`--font-size-*`). Every other length — widths, heights, paddings, margins, gaps, breakpoints, border-radius, gap, max-width — uses `px`.

```css
/* ✓ Right */
font-size: var(--font-size-md);   /* rem in the token: 1.0625rem */
max-width: 720px;
padding: 16px 24px;
gap: 12px;
border-radius: 8px;

@media (min-width: 1024px) {
  grid-template-columns: 220px 1fr;
}

/* ✗ Wrong — rem for layout */
max-width: 45rem;
padding: 1rem 1.5rem;
gap: 0.75rem;
border-radius: 0.5rem;

@media (min-width: 60rem) {
  grid-template-columns: 15rem 1fr;
}
```

**Exception:** `em` inside `letter-spacing` is allowed because `em` is font-size-relative by definition and that's the correct unit.

Use the project's spacing tokens (`--spacing-*`) for paddings, gaps, and margins — those tokens are themselves in `px`.

### Even numbers only

Every `px` value uses an even integer. No fractional pixels, no odd numbers.

```css
/* ✓ Right */
gap: 4px;
width: 220px;
outline-width: 2px;
text-underline-offset: 4px;
box-shadow: inset 2px 0 0 0 var(--accent);

/* ✗ Wrong */
gap: 5px;
width: 219px;
outline-width: 3px;
text-underline-offset: 3px;
width: 1.5px;
height: calc(var(--spacing-4) + 25px);
```

Three exceptions:

1. `1px` — hairlines, borders, fine dividers. Always allowed.
2. Semantic infinity — `999px` and `9999px` for `border-radius` when the visual intent is "fully rounded" / pill shape.
3. Computed values — `calc()`, `clamp()`, `min()`, `max()` results don't count because the inputs are constrained by the rules above and the output is the result of math, not a hand-picked number.

Any even integer is valid — `2px`, `4px`, `6px`, ..., `22px`, `24px`, `26px`, `28px`, `30px`, and so on. The spacing tokens (`--spacing-*`) cover the common values, but bare even px values are equally fine when no token fits the exact need.

When tempted to use an odd number, round to the **nearest even number**:

```css
/* ✗ */
padding: 25px;
margin-top: 13px;
gap: 7px;

/* ✓ — nearest even value */
padding: 24px;     /* or var(--spacing-6) */
margin-top: 14px;
gap: 8px;          /* or var(--spacing-2) */
```

Prefer spacing tokens for paddings/gaps/margins where the value matches the scale, but don't force a token when an off-scale even value is the right call (e.g., `26px`, `38px`).
