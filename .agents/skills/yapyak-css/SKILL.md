---
name: yapyak-css
description: "CSS: `[Role]ElementType` class naming, DOM-mirrored nesting, design tokens, cascade, units, layout. Use when editing `*.css` files or component styles."
---

### Design tokens

Tokens live in `src/styles/tokens.css`.

#### Tier 1 — Palette (`--color-*`)

A small set of raw palette colors, named after their identity (what the color IS).

```css
--color-mint:   oklab(0.87 -0.24 0.06);
--color-aqua:   oklab(0.88 -0.21 0.01);
--color-coral:  #ff9aa0;
--color-silver: #e6e6e6;
--color-ink:    #141414;
```

Components must never reference `--color-*` directly. The palette only exists to feed tier 2.

#### Tier 2 — Semantic (everything else)

What components actually use. Named after intent (what the color DOES).

- Color intent (`--brand`, `--accent`, `--danger`) — assigns a palette color to a semantic role. Swap these to re-theme.
- Variants (`--brand-soft`, `--brand-glow-strong`, `--accent-soft`) — derived from `--brand` / `--accent` via `color-mix(in oklch, var(--brand) X%, transparent)`. Never from `--color-*` directly.
- Surfaces, rings, text (`--surface`, `--ring`, `--text-soft`) — derived from `--color-silver` or `--color-ink`.
- Effects (`--shadow-brand-glow`, `--gradient-brand`) — composite values derived from semantic tokens.

#### Rules

1. Components only use tier 2. Never `var(--color-mint)` in a component CSS — use `var(--brand)`.
2. Tier 2 variants derive from tier 2 intent, not from palette. `--brand-soft` mixes from `--brand`, not from `--color-mint`. This keeps the swap chain working: change `--brand` → all `--brand-*` variants follow.
3. No raw hex/rgba/oklab in component CSS. If you need a translucent brand color, write `color-mix(in oklch, var(--brand) X%, transparent)` inline. Never inline `oklab(0.87 -0.24 0.06 / X)`.
4. Re-theming is a swap: change `--brand: var(--color-aqua)` and the entire site updates without touching components.

### Modules

All component/route styling uses CSS Modules with CSS custom properties from the design token system.

#### File placement

- Components: `ComponentName.module.css` next to `ComponentName.tsx`.
- Routes: `route.module.css` next to `route.tsx`.

#### Import

```tsx
import styles from './route.module.css';
import styles from './Button.module.css';
```

#### Class naming — deterministic algorithm

Every class name ends with an ElementType from the fixed vocabulary below. The only exception is the component root, which is the component name.

No creativity, no judgement, no "semantic" names. Same input always produces the same name.

```
CLASS NAME = [Role]ElementType
             └─optional┘└─required, from fixed vocab─┘
```

##### ElementType

The required final segment, drawn from the closed vocabulary in [[yapyak-element-type]]. Never invent one ad-hoc.

**Landmark layout.** Landmark names come from [[yapyak-element-type]]; arrange them as one trio per container, never mixed:

- Vertical trio: `Header` / `Content` / `Footer`.
- Horizontal trio: `Sidebar` + `Main`; or `StartBar` + `EndBar` when there are two sidebars. `Content` partners `Sidebar` when a parent layout already owns the page's one `<main>`.
- Inside a vertical trio the middle region is always `Content` (`as="section"` only when it needs a landmark); use `Section` for a standalone landmark, never as the trio middle.
- Each landmark name appears at most once per component.

##### Picking the Role (prefix)

Role is picked by strict priority — stop at the first match:

1. Data field — if rendering a named data field, Role = PascalCase field name
   - `{action.description}` → Role `Description`
   - `{user.firstName}` → Role `FirstName`
2. Domain concept — if the element represents a named domain concept, Role = that concept. A domain-concept Role is allowed ONLY if the name is an exported domain/resource/enum name from the content schema or yapyak public types, OR a standard domain term for the rendered concept (`Endpoint`, `Method`). If neither, fall through to step 3 (Qualifier).
   - `MethodBadge + Path` together = `Endpoint` (REST term)
3. Qualifier from fixed vocab — when multiple siblings share an ElementType:

   | Axis | Qualifiers |
   |---|---|
   | Position (horizontal) | `Leading` / `Trailing` |
   | Position (vertical) | `Top` / `Bottom` |
   | Importance | `Primary` / `Secondary` |
   | Function | `Search`, `Submit`, `Cancel`, `Confirm`, `Close`, `Empty` |
4. No Role — when EITHER:
   - the ElementType is an HTML5 landmark (the `Header` / `Footer` / `Content` / `Sidebar` / `Main` / `Navigation` / `StartBar` / `EndBar` group) or a decorative ElementType (`Icon`, `Chevron`, `Divider`, …) appearing once in its parent; OR
   - steps 1–3 produced no Role and only one such element exists in its parent.

##### Examples

```
.ActionBanner              // root (component name)
.EndpointRow               // role: Endpoint, type: Row
.PathCode                  // role: Path, type: Code
.SummaryParagraph          // role: Summary, type: Paragraph
.DeprecatedBadge           // role: Deprecated, type: Badge
.Header                    // no role (only one), type: Header (landmark)
.SearchIcon                // role: Search, type: Icon
.EmptyParagraph            // role: Empty, type: Paragraph
.Chevron                   // no role (lone decoration), type: Chevron
```

##### Wrapper form (special)

A wrapper is an element with exactly one child, existing only for layout/positioning. Its class name is `[ChildClassName]Wrapper`:

- Wraps `.SearchIcon` → `.SearchIconWrapper`
- Wraps `.DeprecatedBadge` → `.DeprecatedBadgeWrapper`

(`Wrapper` IS an ElementType in this concatenated form.)

Never create chained wrappers. If a layout property can go on the child directly, the wrapper must not exist.

##### Root form (only exception)

The component's root class is just the component name (no Role, no ElementType suffix): `.Button`, `.Dialog`, `.Route`.

##### Forbidden

- Class names NOT ending with a vocabulary ElementType:
  - ✗ `.Description` (must be `.DescriptionParagraph`)
  - ✗ `.Title` (must be `.NameHeading`, `.PageHeading`, etc.)
- Semantic group names without ElementType: `.Actions`, `.Meta`, `.Info`, `.Details`, `.Body`
- Fantasy suffixes not in vocab: `.Container`, `.Inner`, `.Outer`, `.Panel`, `.Holder`

If no rule matches unambiguously, the structure is wrong, not the name. Fix the structure.

#### CSS nesting mirrors DOM structure — strict

Every nested rule reflects the actual element hierarchy. A class lives at the exact same nesting depth in CSS as its element lives in the DOM. No flattened descendant selectors. No shortcuts.

```html
<div class="Button">
  <span class="Atom">
    <span class="Content"></span>
  </span>
</div>
```

```css
/* ✓ Right — CSS mirrors DOM */
.Button {
  .Atom {
    .Content {
    }
  }
}

/* ✗ Wrong — Content at root */
.Content { }

/* ✗ Wrong — descendant combinator skipping a level */
.Button .Content { }

/* ✗ Wrong — combined selector instead of nested */
.Button .Atom { }
```

No combined descendant selectors at the top level. This includes `>` (child) combinators: `.Foo > .Bar` becomes `.Foo { > .Bar { ... } }`.

**Exception:** classes that legitimately appear at multiple DOM positions. Nest under the nearest common parent — never duplicate the rule under every possible parent.

```css
/* DOM: .Description appears inside both .Article.Body and .Article.Header */

/* ✓ Right — nest under nearest common ancestor */
.Article {
  .Description {
    color: var(--text-soft);
  }
  .Body { /* body-specific */ }
  .Header { /* header-specific */ }
}

/* ✗ Wrong — duplicating */
.Article {
  .Body { .Description { color: var(--text-soft); } }
  .Header { .Description { color: var(--text-soft); } }
}
```

If a class is shared across **multiple components** (not just sub-trees), it lives in a global `style.css` at top level — documented as a global utility.

#### Never flatten nested selectors

Always open a new nested block for each state/variant — never chain state and descendant in one selector.

```css
/* ✓ Right — nested */
.Root {
  &[data-item-type='action'] {
    .TypeBadge { background-color: var(--color-blue-100); }
  }
  &:hover {
    .Icon { color: var(--intent-primary); }
  }
}

/* ✗ Wrong — flattened chain */
.Root {
  &[data-item-type='action'] .TypeBadge { ... }
  &:hover .Icon { ... }
}
```

#### Group shared selectors with `:is()`

Wrap 2+ selectors that share a declaration block in one `:is(…)`; a bare comma-separated list of class or compound selectors is forbidden.

```css
/* ✓ one selector — composes with combinators, states, and nesting */
:is(.TitleHeading, .TitleLink) {
  color: var(--foreground-soft);
}

> :is(.TitleHeading, .TitleLink) {
  font-size: var(--font-size-xs);
}

/* ✗ N rules — repeats the combinator, breaks the moment a compound is added */
.TitleHeading, .TitleLink {
  color: var(--foreground-soft);
}

> .TitleHeading, > .TitleLink {
  font-size: var(--font-size-xs);
}
```

Keep a bare comma list only where `:is()` cannot apply — pseudo-elements are forbidden inside `:is()` (the reset's `*, *::before, *::after`).

#### Select by class, never by element type

Every element carries a class (see Class naming) — target it. Never write a bare type selector (`div`, `span`, `a`, `li`, `code`) in component CSS → target the element's class.

```css
/* ✓ target the class */
.Button {
  .ButtonIcon { ... }
}

/* ✗ bare type selector */
.Button {
  svg { ... }
}
```

Browser-rendered pseudo-elements (`::marker`, `::selection`, `::placeholder`) attach to the element's class, never to a bare tag. A child rendered by another component gets configured via inherited custom properties (see Cross-component styling), never by reaching for its tag.

#### State selectors

- Root states go on the component root class only — never on a child. This covers `data-*`, `aria-*`, `:has()`, `:not()`. Child styling under a root state is done by nesting child selectors inside the state block on root.
- Pseudo-class states on interactive leaf elements stay on the element. `:hover`, `:focus`, `:focus-visible`, `:active`, `:disabled`, `:checked` on `Button`, `Link`, `Input`, `Textarea`, `Select`, `Option` belong on the element — never hoist to root.
- `::before` and `::after` are forbidden. No decorative pseudo-elements. They can't be inspected as DOM nodes, can't carry children, can't carry semantic attributes, and duplicate intent across CSS and HTML. Render a real element instead — `<hr>`, `<div>`, `<span>` — with its own class. For visual effects like inset dividers, use `background-image` or `border` on the real element.
- `::placeholder`, `::selection`, `::marker`, `::first-letter`, and other browser-rendered pseudo-elements are allowed — they style content the browser already renders, with no real-element alternative. They stay on the element.
- State blocks come last in a rule — after own properties and all child selectors.

#### CSS selector order

Within a selector block:

1. CSS variable defaults (configurable knobs at the top)
2. Own properties
3. Child element selectors
4. Pseudo-classes and state modifiers (`&:hover`, `&[data-*]`)

```css
.Sidebar {
  --sidebar-width: 320px;
  --sidebar-bg: var(--surface);

  display: flex;
  width: var(--sidebar-width);
  background-color: var(--sidebar-bg);

  .SidebarHeader { ... }
  .SidebarList { ... }

  &[data-collapsed] { ... }
}
```

#### Blank line between adjacent rule blocks

Every rule block at the same nesting level is separated by a blank line.

```css
/* ✗ Adjacent blocks touching */
.Swatch {
  &[data-accent='react'] {
    background-color: var(--accent-react);
  }
  &[data-accent='vue'] {
    background-color: var(--accent-vue);
  }
}
```

```css
/* ✓ Blank line between */
.Swatch {
  &[data-accent='react'] {
    background-color: var(--accent-react);
  }

  &[data-accent='vue'] {
    background-color: var(--accent-vue);
  }
}
```

#### CSS variable defaults

Declare a knob's default at the top of the root class; read it as `var(--name)`. The fallback form `var(--name, default)` is forbidden — except in the one row below where a top declaration is mechanically impossible.

```css
/* ✓ default at top, read bare */
.Button {
  --button-size: 16px;

  width: var(--button-size);
}

/* ✗ fallback where a top declaration works */
.Button {
  width: var(--button-size, 16px);
}
```

Consumers override via inline `style`:

```tsx
<Button style={{ '--button-size': '32px' }} />
```

The override source decides the form — a top declaration works iff it does not shadow the override:

| Override set by | Top declaration | Form |
|---|---|---|
| Inline `style` on the same element | wins (inline beats rule) | `--name` at top, read `var(--name)` |
| The element's own variant/state block | wins (later declaration) | `--name` at top, read `var(--name)` |
| An ancestor (inherited config) | shadows the inherited value | no top declaration, read `var(--name, default)` |

The last row is the only place the fallback is allowed, and there it is required — see Cross-component styling.

#### Cross-component styling

A parent never selects a child it renders — CSS Modules scope class names per file, so the child's class is unreachable anyway. The parent drives a child by setting custom properties on itself; the child reads them. Names are global across modules and inherit down.

```css
/* child module — reads inherited values with its own fallback */
.CopyButton {
  opacity: var(--copy-button-opacity, 0);
}
```

```css
/* parent module — sets on itself, never selects the child */
.CodeBlock:hover {
  --copy-button-opacity: 1;
}
```

When the trigger is the child's own state, name the child in `:has()` — the one unavoidable child reference, since inheritance flows down only. Pass the child a class named its component root; the child merges it, so the parent's scoped copy lands on the child and `:has()` reaches it.

```tsx
<CopyButton className={styles.CopyButton} />
<PreformattedText className={styles.PreformattedText} />
```

The trigger is any child state — a `data-*` attribute or a native pseudo-class. The parent reacts on its own root: drive a child var, or style itself.

```css
/* child's data state → drive a child var */
.CodeBlock:has(.CopyButton[data-copied]) {
  --copy-button-opacity: 1;
}

/* child's focus → style the parent's own frame */
.CodeBlock:has(.PreformattedText:focus-visible) {
  outline-color: var(--accent-soft);
}
```

Never tag a child with a `data-*` attribute as a CSS hook — `data-*` carries state ("what state is this in?"), never identity ("which component is this?").

#### `data-*` selectors stay inside the owning component

Every `data-*` selector lives in the module CSS of the component whose element carries the attribute. Global CSS (`src/styles/*.css`) declares tokens, resets, and utilities only — never a `data-*` selector.

```css
/* ✗ Global stylesheet targets a component-rendered attribute */
/* src/styles/*.css */
[data-value='primary'] {
  color: var(--brand);
}
```

```css
/* ✓ The component owns the selector alongside its class */
.Component {
  &[data-value='primary'] {
    color: var(--brand);
  }
}
```

A global `data-*` selector matches every element with that attribute anywhere on the page — an implicit cross-component contract with no owner.

#### State and variant styling

Use data attributes on the **root element** for state and variants. Child elements are styled via parent nesting — they never carry data attributes themselves.

```css
/* ✓ Right — data attribute on root, children styled via nesting */
.Button {
  background-color: var(--surface-bevel);

  .ButtonIcon {
    color: var(--text-secondary);
  }

  &[data-appearance='solid'] {
    background-color: var(--intent-primary);

    .ButtonIcon {
      color: var(--intent-primary-contrast);
    }
  }

  &[data-disabled] {
    opacity: 0.5;
  }
}

/* ✗ Wrong — data attribute on child */
.Button {
  .ButtonIcon {
    &[data-appearance='solid'] { ... }
  }
}
```

Route files rarely need data attributes — if a route element needs variants, extract it into a component.

#### Variant value — direct property, or a variant-scoped var

Set the varied property directly in the variant block. Reach for a variant-scoped custom property only when a direct set would duplicate structure across variants.

| The varied value | Form |
|---|---|
| One property, applied where it is set | direct — `&[data-x="a"] { color: … }` |
| Read in more than one declaration | var — variant sets `--name`, root reads `var(--name)` |
| Sits inside a shared `color-mix` / `box-shadow` / `calc` | var |
| Applied through a nested child selector | var |

```css
/* ✓ trivial — set direct */
.Swatch {
  &[data-accent="vue"] {
    background-color: var(--accent-vue);
  }
}

/* ✓ shared structure — variant swaps the var, root owns the formula */
.KindBadge {
  color: var(--kind-badge-color);
  background-color: color-mix(
    in oklab,
    var(--kind-badge-color) 14%,
    transparent
  );

  &[data-variant="hook"] {
    --kind-badge-color: var(--kind-hook);
  }
}

/* ✗ var for a single trivial property — needless indirection */
.Swatch {
  &[data-accent="vue"] {
    --swatch-color: var(--accent-vue);
  }
}
```

#### Naming a variant / configured custom property

Applies to the custom properties a variant block or a parent sets — the ones carrying a style choice. Internal implementation vars (JS-driven positions, animation state, layout constants) keep their own local names; this leaves them alone.

Name them `--[root-class]-[role]`:

- **`[root-class]`** — the component's root class, kebab-case, in full. `.KindBadge` → `--kind-badge-…`; `.BlockRendererNodeDiagnostic` → `--block-renderer-node-diagnostic-…`. Names are global across modules, so the full root class is the only collision-proof, judgement-free prefix. For a parent-configured var, the root class of the component that reads it.
- **`[role]`** — the CSS property the value lands in, spelled as its exact MDN longhand name. Bare assignment (`property: var(--x)`) wins when it feeds several. A value that is one argument inside `color-mix` / `box-shadow` / `calc` takes `[property]-[argument]` (`-color`, `-alpha`). Never a synonym (`color`, not `accent`), never an abbreviation (`background`, not `bg`), never a shorthand (`mask-image`, not `mask`).

```css
/* ✓ role is the property, prefix is the full root class */
.Callout {
  .TitleText {
    color: var(--callout-color);
  }

  &[data-variant="tip"] {
    --callout-color: var(--tip);
  }
}

/* ✗ invented synonym for a bare `color` */
.Callout {
  .TitleText {
    color: var(--callout-accent);
  }
}
```

### Rules

#### Cascade layer

All component/route CSS is wrapped in `@layer components`. Lets design tokens and resets sit in their own layers without specificity wars.

#### Use design tokens, never hardcoded values

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

#### Never reset element defaults in component CSS

The global reset (under `@layer reset`) strips browser defaults. Typical resets handled:

| Element / Property | What's reset |
|---|---|
| `*, *::before, *::after` | `box-sizing: border-box`, `margin: 0`, `padding: 0` |
| `ul`, `ol` | `list-style: none` |
| `a` | `color: inherit`, `text-decoration: none` |
| `button` | `font: inherit`, `color: inherit`, `cursor: pointer`, `background: none`, `border: 0` |
| `input`, `textarea`, `select` | `font: inherit`, `color: inherit`, `letter-spacing: inherit`, `background: none`, `border: 0` |
| `img`, `video`, `svg` | `display: block`, `max-width: 100%` |
| `h1`–`h6` | `font-size: inherit`, `font-weight: inherit` |
| `th` | `text-align: left` |

Never write any of these properties in a component CSS to "reset" them — the reset already did. Delete any property/value that exactly matches a row in the reset table above. Keep everything else. Never reason about browser defaults beyond that table.

If a new reset is needed broadly, add it to the global reset file — not per-component.

#### Never write vendor prefixes

Build pipeline auto-prefixes via Lightning CSS based on browserslist targets. Write the standard property only:

```css
/* ✓ */
user-select: none;
appearance: none;

/* ✗ — manual prefixes, dead code */
-webkit-user-select: none;
-moz-appearance: none;
```

#### Prefer `flex` / `grid` + `gap` over `margin`

Default to gap when laying out siblings — always restructure the parent to flex/grid + `gap` unless one of the two `margin` exceptions below applies.

Use `margin` only for (1) optical alignment of a single element against a container edge, or (2) spacing between siblings whose nearest common parent is not yours to convert to flex/grid (third-party or shared-layout markup). Every other sibling-spacing case uses `gap`. If unsure, use `gap`.

#### Never write `flex-grow`, `flex-shrink`, `flex-basis`

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

#### Never leave unnecessary properties

Every property must pay for itself. Prune only a property whose value exactly equals its reset-table value. Never prune `display`/`width` by guessing what a parent imposes — that needs runtime layout.

#### Every element earns its place

An element whose entire property set could move to its parent or its only child is redundant — delete it and move any real property up or down. A component root wraps its content directly; never nest a lone layout container (`.Stack`, `.Content`) inside a root that could carry the layout itself. When a feature is removed, collapse any element that existed only for it — leave the structure as if the feature had never been there.

```css
/* ✗ root wraps a lone layout container */
.HeroDemo {
  isolation: isolate;

  .Stack {
    display: flex;
    gap: var(--spacing-8);
  }
}

/* ✓ root is the layout container */
.HeroDemo {
  display: flex;
  gap: var(--spacing-8);
}
```

#### Use `background-color`, not `background` shorthand

Single value → specific longhand: solid color → `background-color`, gradient/image → `background-image`. Use the `background` shorthand only when setting two or more of {image, position, size, repeat, color} in one declaration.

```css
/* ✓ */
background-color: var(--surface);

/* ✗ — shorthand resets everything else */
background: var(--surface);
```

#### Nesting is for structure and state only

Child elements are nested (mirroring DOM). Pseudo-classes and data attributes are nested. Other top-level rules are not.

#### Always wrap `:hover` in `@media (hover: hover)`

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

#### Every interactive element needs an `:active` state

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

#### Gate state effects behind `&:enabled` for disablable elements

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

#### Mobile-first responsive

Three breakpoints, and no others:

| Breakpoint | Purpose |
|---|---|
| `min-width: 640px` | Component-internal refinement — padding, font-size, compact→full labels. Never a page-level shift. |
| `min-width: 1024px` | Layout shift — mobile (stacked, 1-col) to desktop (multi-col). |
| `min-width: 1324px` | Content reaches `--layout-max-width` and the shell widens. Container ceiling, not a content reflow. |

Mobile-first. Default CSS targets mobile. `@media (min-width: …)` enhances upward. Never use `max-width` queries → use mobile-first `min-width`.

```css
/* ✓ mobile-first */
.Component {
  grid-template-columns: 1fr;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
}

/* ✗ desktop-first */
.Component {
  grid-template-columns: 1fr 1fr;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}
```

No value outside these three is permitted. A component that seems to need another threshold has the wrong structure → fix the structure.

#### Length units — `px` for layout, `rem` only for font-size

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

#### Even numbers only

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

Prefer spacing tokens for paddings/gaps/margins where the value matches the scale. Use the spacing token whose value exactly equals the needed px. If no token equals it exactly, use the bare even px. Never round a value to fit a token.
