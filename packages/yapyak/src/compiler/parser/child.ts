import type { Node, Program } from 'oxc-parser';

import { visitorKeys } from 'oxc-parser';

export function collectChildren(node: Node): Exclude<Node, Program>[] {
  const keys = visitorKeys[node.type];
  if (keys === undefined) {
    throw new Error(`[yapyak] Node type "${node.type}" has no visitor keys.`);
  }
  const children: Exclude<Node, Program>[] = [];
  for (const key of keys) {
    const value: unknown = Reflect.get(node, key);
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isChild(item)) {
          children.push(item);
        }
      }
      continue;
    }
    if (isChild(value)) {
      children.push(value);
    }
  }
  return children;
}

function isChild(value: unknown): value is Exclude<Node, Program> {
  return typeof value === 'object' && value !== null && 'type' in value;
}
