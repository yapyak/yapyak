import type { TypeNode } from 'typescript';
import type { TypeToken } from './type';

export function buildTypeTokens(node?: TypeNode): TypeToken[] {
  if (node === undefined) {
    return [];
  }
  return [
    {
      kind: 'text',
      text: node.getText(),
    },
  ];
}
