import type { Template, TemplateNode } from './node';

type PlaceholderKind =
  | 'date'
  | 'number'
  | 'plural'
  | 'select'
  | 'selectordinal'
  | 'simple'
  | 'time';

export type Placeholder = {
  kind: PlaceholderKind;
  name: string;
};

export function extractPlaceholders(template: Template): Placeholder[] {
  const placeholdersByName = new Map<string, Placeholder>();
  walkTemplate(template, placeholdersByName);
  return [
    ...placeholdersByName.values(),
  ];
}

function walkTemplate(
  template: Template,
  placeholdersByName: Map<string, Placeholder>,
): void {
  for (const node of template) {
    walkNode(node, placeholdersByName);
  }
}

function walkNode(
  node: TemplateNode,
  placeholdersByName: Map<string, Placeholder>,
): void {
  switch (node.kind) {
    case 'literal':
    case 'count':
      return;
    case 'placeholder':
      registerPlaceholder(placeholdersByName, node.name, 'simple');
      return;
    case 'number':
      registerPlaceholder(placeholdersByName, node.name, 'number');
      return;
    case 'date':
      registerPlaceholder(placeholdersByName, node.name, 'date');
      return;
    case 'time':
      registerPlaceholder(placeholdersByName, node.name, 'time');
      return;
    case 'plural':
      registerPlaceholder(
        placeholdersByName,
        node.name,
        node.type === 'ordinal' ? 'selectordinal' : 'plural',
      );
      for (const branch of Object.values(node.branches)) {
        walkTemplate(branch, placeholdersByName);
      }
      return;
    case 'select':
      registerPlaceholder(placeholdersByName, node.name, 'select');
      for (const branch of Object.values(node.branches)) {
        walkTemplate(branch, placeholdersByName);
      }
      return;
    default:
      return;
  }
}

function registerPlaceholder(
  placeholdersByName: Map<string, Placeholder>,
  name: string,
  kind: PlaceholderKind,
): void {
  if (name === '') {
    return;
  }
  if (placeholdersByName.has(name)) {
    return;
  }
  placeholdersByName.set(name, {
    kind,
    name,
  });
}
