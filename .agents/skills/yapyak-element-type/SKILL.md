---
name: yapyak-element-type
description: "The closed ElementType vocabulary that ends both CSS class names ([Role]ElementType) and component names ([Resource]ElementType). Use when naming a CSS class or a component by its root element."
---

The closed set of nouns that end every UI name. One vocabulary, two consumers:

- **CSS class** — `[Role]ElementType` ([[yapyak-css]]).
- **Component** — `[Resource]ElementType` ([[yapyak-react]]); a component's name IS its root class.

A UI name's final segment is always an entry below — never invented ad-hoc.

### Atomic types

One HTML element or layout role each.

**Layout** — element wraps 2+ children:

| Name | Element / role |
|---|---|
| `Row` | `flex-direction: row`, or `<tr>` |
| `Stack` | `flex-direction: column` |
| `Grid` | `display: grid` |
| `Bar` | horizontal strip of inline controls (`<div>`) |
| `Wrapper` | single-child positioning wrapper (`<div>`) |
| `List` | `<ul>` / `<ol>` |
| `DescriptionList` | `<dl>` |
| `Term` | `<dt>` |
| `Description` | `<dd>` |

**Landmark** — the element IS a landmark region:

| Name | Element / role |
|---|---|
| `Header` | `as="header"` |
| `Footer` | `as="footer"` |
| `Main` | `as="main"` |
| `Sidebar` | `as="aside"` |
| `StartBar` / `EndBar` | `as="aside"` (the two-sidebar pair) |
| `Navigation` | `as="nav"` |
| `Section` | `as="section"` |
| `Article` | `as="article"` |
| `Content` | default `<div>`, or `as="section"` when the region needs a landmark |

**Text:**

| Name | Element / role |
|---|---|
| `Heading` | heading element |
| `Title` | title cluster (heading + optional badge) |
| `Paragraph` | `<p>` |
| `Text` | `<span>` |
| `PreformattedText` | `<pre>` |
| `Code` | `<code>` |
| `Label` | `<label>` |

**Interactive:**

| Name | Element / role |
|---|---|
| `Link` | `<a>` |
| `Button` | `<button>` |

**Form:**

| Name | Element / role |
|---|---|
| `Input` | `<input>` |
| `Textarea` | `<textarea>` |
| `Select` | `<select>` |
| `Form` | `<form>` |
| `Fieldset` | `<fieldset>` |

**Media:**

| Name | Element / role |
|---|---|
| `Icon` | icon-role `<svg>` |
| `Image` | `<img>` |

**Indicator / primitive:**

| Name | Element / role |
|---|---|
| `Badge` | pill, chip, tag |
| `Divider` | `<hr>` or visual separator |
| `Chevron` / `Arrow` / `Dot` / `Caret` | the matching icon / indicator |
| `Spacer` | spacer element |
| `Overlay` | full-cover decorative layer |
| `Skeleton` | loading placeholder |

**List item:**

| Name | Element / role |
|---|---|
| `Item` | `<li>` |
| `Option` | `<option>` |

**Table cell:**

| Name | Element / role |
|---|---|
| `Cell` | `<td>` |
| `HeaderCell` | `<th>` |

### Composite types

A component-level pattern, not one element. Each grounds in a root element, so its class name stays valid.

| Name | Root | Pattern |
|---|---|---|
| `Layout` | shell over `<Outlet />` | list / workspace route shell |
| `Detail` | shell over `<Outlet />` | single-instance route shell |
| `Summary` | `<dl>` | read-only field list |
| `Card` | `<article>` | bordered preview block |
| `Table` | `<table>` | tabular data |
| `PickList` | `<ul>` | selectable rows |
| `ActionsBar` | `<div>` | actions strip |
| `SearchInput` | `<input>` | wrapped search input |
| `EmptyMessage` | `<div>` | empty state |

### Multi-match priority

When an element matches 2+ entries, pick in this order:

`landmark` > `semantic tag` (List / DescriptionList / Table / cells / Form) > `layout` (Row / Stack / Grid / Bar) > `text` > `interactive` > `media` > `indicator`.

A `<tr>` is a semantic table element, so it resolves to `Row` before any layout reading.

### Not in the set

Extend the table in the same commit — never name ad-hoc. If the element is not a real HTML element or layout role, the structure is wrong.
