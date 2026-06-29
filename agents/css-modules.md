## CSS — modules

All component/route styling uses CSS Modules with CSS custom properties from the design token system.

### File placement

- Components: `ComponentName.module.css` next to `ComponentName.tsx`.
- Routes: `route.module.css` next to `route.tsx`.

### Import

```tsx
import styles from './route.module.css';
import styles from './Button.module.css';
```

### Class naming — deterministic algorithm

Every class name ends with an ElementType from the fixed vocabulary below. The only exception is the component root, which is the component name.

No creativity, no judgement, no "semantic" names. Same input always produces the same name.

```
CLASS NAME = [Role]ElementType
             └─optional┘└─required, from fixed vocab─┘
```

#### Fixed ElementType vocabulary

Every class name must end with one of these. Nothing else is valid.

Group / layout (element wraps ≥2 children):

| Name | Meaning |
|---|---|
| `Row` | flex-direction: row |
| `Stack` | flex-direction: column |
| `Grid` | display: grid |
| `List` | `<ul>` / `<ol>` (semantic list) |
| `DescriptionList` | `<dl>` (key/value pairs) |
| `Term` | `<dt>` (label half of a `<dl>` pair) |
| `Description` | `<dd>` (value half of a `<dl>` pair) |

HTML5 landmarks (element IS a landmark region). Two layout trios — pick one per container, don't mix.

Vertical trio (stacked top-to-bottom):

| Name | Meaning |
|---|---|
| `Header` | `as="header"` |
| `Content` | default `<div>`, or `as="section"` if the region needs a landmark |
| `Footer` | `as="footer"` |

Horizontal trio (side-by-side):

| Name | Meaning |
|---|---|
| `Sidebar` | `as="aside"` — used only when there is exactly ONE sidebar |
| `Main` | `as="main"` — only at the outermost page layout. Exactly one `<main>` per page, ever. Partner of `Sidebar`. |
| `Content` | default `<div>` — partner of `Sidebar` when `<main>` is already taken by a parent layout. Common in nested layouts. |
| `StartBar` / `EndBar` | `as="aside"` — used when there are TWO sidebars (replaces `Sidebar`) |

Other landmarks (standalone):

| Name | Meaning |
|---|---|
| `Nav` | `as="nav"` |
| `Section` | `as="section"` |
| `Article` | `as="article"` |

Each landmark name appears max once per component.

Text content:

| Name | Meaning |
|---|---|
| `Heading` | `<Heading>` / heading element |
| `Paragraph` | `<p>` |
| `Text` | `<span>` / plain text |
| `PreformattedText` | `<pre>` |
| `Code` | `<code>` |
| `Label` | `<label>` |

Interactive:

| Name | Meaning |
|---|---|
| `Link` | `<a>` |
| `Button` | `<button>` |

Form:

| Name | Meaning |
|---|---|
| `Input` | `<input>` |
| `Textarea` | `<textarea>` |
| `Select` | `<select>` |
| `Form` | `<form>` |
| `Fieldset` | `<fieldset>` |

Media:

| Name | Meaning |
|---|---|
| `Icon` | icon-role `<svg>` |
| `Image` | `<img>` |

Indicators / primitives:

| Name | Meaning |
|---|---|
| `Badge` | pill, chip, tag (canonical name) |
| `Divider` | `<hr>` or visual separator |
| `Chevron` | chevron icon |
| `Arrow` | arrow icon |
| `Dot` | dot indicator |
| `Caret` | text caret |
| `Spacer` | spacer element |
| `Overlay` | full-cover decorative layer |
| `Skeleton` | loading placeholder block |

List items:

| Name | Meaning |
|---|---|
| `Item` | `<li>` |
| `Option` | `<option>` |

Table cells:

| Name | Meaning |
|---|---|
| `Cell` | `<td>` |
| `HeaderCell` | `<th>` |

If the element you need doesn't fit any of these, the vocabulary needs expanding — discuss and extend the list. Never invent a suffix ad-hoc.

#### Picking the Role (prefix)

Role is picked by strict priority — stop at the first match:

1. Data field — if rendering a named data field, Role = PascalCase field name
   - `{action.description}` → Role `Description`
   - `{user.firstName}` → Role `FirstName`
2. Domain concept — if the element represents a named domain concept, Role = that concept
   - `MethodBadge + Path` together = `Endpoint` (REST term)
3. Qualifier from fixed vocab — when multiple siblings share an ElementType:

   | Axis | Qualifiers |
   |---|---|
   | Position (horizontal) | `Leading` / `Trailing` |
   | Position (vertical) | `Top` / `Bottom` |
   | Importance | `Primary` / `Secondary` |
   | Function | `Search`, `Submit`, `Cancel`, `Confirm`, `Close`, `Empty` |
4. No role — only when the element has no semantic role AND there is only one such element in its parent.

#### Examples

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

#### Wrapper form (special)

A wrapper is an element with exactly one child, existing only for layout/positioning. Its class name is `[ChildClassName]Wrapper`:

- Wraps `.SearchIcon` → `.SearchIconWrapper`
- Wraps `.DeprecatedBadge` → `.DeprecatedBadgeWrapper`

(`Wrapper` IS an ElementType in this concatenated form.)

Never create chained wrappers. If a layout property can go on the child directly, the wrapper must not exist.

#### Root form (only exception)

The component's root class is just the component name (no Role, no ElementType suffix): `.Button`, `.Dialog`, `.Route`.

#### Forbidden

- Class names NOT ending with a vocabulary ElementType:
  - ✗ `.Description` (must be `.DescriptionParagraph`)
  - ✗ `.Title` (must be `.NameHeading`, `.PageHeading`, etc.)
  - ✗ `.Content` (must be `.ContentSection` — or the structure is wrong; extract a sub-component)
- Semantic group names without ElementType: `.Actions`, `.Meta`, `.Info`, `.Details`, `.Body`
- Fantasy suffixes not in vocab: `.Container`, `.Inner`, `.Outer`, `.Group`, `.Block`, `.Panel`, `.Holder`

If no rule matches unambiguously, the structure is wrong, not the name. Fix the structure.

### CSS nesting mirrors DOM structure — strict

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

**Exception:** classes that legitimately appear at multiple DOM positions. Nest under the nearest common parent — don't duplicate the rule under every possible parent.

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

### Never flatten nested selectors

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

### State selectors

- Root states go on the component root class only — never on a child. This covers `data-*`, `aria-*`, `:has()`, `:not()`. Child styling under a root state is done by nesting child selectors inside the state block on root.
- Pseudo-class states on interactive leaf elements stay on the element. `:hover`, `:focus`, `:focus-visible`, `:active`, `:disabled`, `:checked` on `Button`, `Link`, `Input`, `Textarea`, `Select`, `Option` belong on the element — don't hoist to root.
- `::before` and `::after` are forbidden. No decorative pseudo-elements. They can't be inspected as DOM nodes, can't carry children, can't carry semantic attributes, and duplicate intent across CSS and HTML. Render a real element instead — `<hr>`, `<div>`, `<span>` — with its own class. For visual effects like inset dividers, use `background-image` or `border` on the real element.
- `::placeholder`, `::selection`, `::marker`, `::first-letter`, and other browser-rendered pseudo-elements are allowed — they style content the browser already renders, with no real-element alternative. They stay on the element.
- State blocks come last in a rule — after own properties and all child selectors.

### CSS selector order

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

### CSS variable defaults

Always declare defaults at the top of the root class — never use the `var(--x, default)` fallback syntax.

```css
/* ✓ Right — defaults declared at top */
.Button {
  --button-size: 16px;
  --button-color: var(--text);

  width: var(--button-size);
  color: var(--button-color);
}

/* ✗ Wrong — fallbacks scattered through the file */
.Button {
  width: var(--button-size, 16px);
  color: var(--button-color, var(--text));
}
```

Consumers override via inline `style`:

```tsx
<Button style={{ '--button-size': '32px' }} />
```

### Cross-component identity — pass `className` from parent, never data attributes

When a parent's CSS module needs to position, lay out, or control visibility of a child component, pass a class from the parent's module to the child as `className`. The child merges it with its own root class. Never tag the child with a `data-*` attribute to act as a CSS hook.

```tsx
// ✓ Right — parent passes its own scoped class; child merges it
<CopyButton className={styles.CopyButton} />
```

```tsx
// inside CopyButton
<Box
  className={[styles.CopyButton, className]}
  data-copied={isCopied ? '' : undefined}
  ...
/>
```

```css
/* ✓ Right — parent targets its own scoped marker class */
.CodeBlock {
  .CopyButton {
    opacity: 0;
    transition: opacity var(--transition);
  }

  &:hover .CopyButton {
    opacity: 1;
  }
}
```

```tsx
// ✗ Wrong — using a data attribute as an identity marker
<CopyButton data-copy-button="" />
```

```css
/* ✗ Wrong — parent CSS hooks into a child's data attribute */
.CodeBlock {
  &:hover [data-copy-button] {
    opacity: 1;
  }
}
```

**Why:**

- `data-*` attributes are reserved for **state** (`data-open`, `data-copied`, `data-active`, `data-selected`). Reading a data attribute should answer the question "what state is this in?" — never "which component is this?".
- Identity belongs to **classes**, which CSS Modules scope per file. Passing the class from parent to child is the canonical mechanism for cross-component positioning.

**Combined with state attributes** — when the parent needs to react to the child's state (e.g. "stay visible while copied"), the marker class scopes identity, the child's own `data-*` carries state, and `:has()` combines them:

```css
.CodeBlock:has(.CopyButton[data-copied]) {
  .CopyButton {
    opacity: 1;
  }
}
```

### State and variant styling

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
