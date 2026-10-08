import type { Node } from 'oxc-parser';

export function isFunctionLike(node: Node): boolean {
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'TSDeclareFunction' ||
    node.type === 'TSEmptyBodyFunctionExpression'
  );
}
