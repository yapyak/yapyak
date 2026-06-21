import type { TypeNode } from 'typescript';
import type { TypeToken } from './type';

export function buildTypeTokens(node?: TypeNode): TypeToken[] {
  if (node === undefined) {
    return [];
  }
  return [
    {
      kind: 'text',
      text: stripComments(node.getText()),
    },
  ];
}

function stripComments(text: string): string {
  let result = text.replace(/\/\*[\s\S]*?\*\//g, '');
  result = result.replace(/\/\/[^\n]*/g, '');
  result = result.replace(/[ \t]+$/gm, '');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}
