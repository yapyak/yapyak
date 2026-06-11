import type { Template, TemplateNode } from './node';

export function resolveConstants(
  template: Template,
  params: Record<string, unknown>,
): Template {
  return resolveNodes(template, params);
}

function resolveNodes(
  template: Template,
  params: Record<string, unknown>,
): Template {
  const resolved: Template = [];
  for (const node of template) {
    const folded = resolveNode(node, params);
    const last = resolved[resolved.length - 1];
    if (
      folded.kind === 'literal' &&
      last !== undefined &&
      last.kind === 'literal'
    ) {
      resolved[resolved.length - 1] = {
        kind: 'literal',
        value: last.value + folded.value,
      };
    } else {
      resolved.push(folded);
    }
  }
  return resolved;
}

function resolveNode(
  node: TemplateNode,
  params: Record<string, unknown>,
): TemplateNode {
  switch (node.kind) {
    case 'literal':
    case 'count':
    case 'number':
    case 'date':
    case 'time':
      return node;
    case 'placeholder': {
      if (!Object.hasOwn(params, node.name)) {
        return node;
      }
      const value = params[node.name];
      if (value === undefined) {
        return node;
      }
      return {
        kind: 'literal',
        value: String(value),
      };
    }
    case 'plural':
      return {
        ...node,
        branches: resolveBranches(node.branches, params),
      };
    case 'select':
      return {
        ...node,
        branches: resolveBranches(node.branches, params),
      };
    default:
      return node;
  }
}

function resolveBranches(
  branches: Record<string, Template>,
  params: Record<string, unknown>,
): Record<string, Template> {
  const resolved: Record<string, Template> = {};
  for (const [name, template] of Object.entries(branches)) {
    resolved[name] = resolveNodes(template, params);
  }
  return resolved;
}
