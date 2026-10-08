import type { Node } from 'oxc-parser';

export type IdentifierNode = Extract<
  Node,
  {
    type: 'Identifier';
  }
>;

export function isReference(node: IdentifierNode): boolean {
  const parent = node.parent;
  if (!parent) {
    return true;
  }
  switch (parent.type) {
    case 'ImportDefaultSpecifier':
    case 'ImportNamespaceSpecifier':
    case 'ImportSpecifier':
      return false;
    case 'MemberExpression':
      return parent.computed || parent.property !== node;
    case 'AccessorProperty':
    case 'MethodDefinition':
    case 'Property':
    case 'PropertyDefinition':
      return parent.computed || parent.key !== node;
    default:
      return true;
  }
}
