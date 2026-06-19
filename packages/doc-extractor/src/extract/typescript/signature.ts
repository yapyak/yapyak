import type {
  ConstructorDeclaration,
  FunctionDeclaration,
  MethodSignature,
  SignatureDeclaration,
} from 'typescript';

import { extractParameters } from './parameter';
import type { ReferenceCallSignature, ReferenceOverload } from './type';
import { buildTypeTokens } from './type-token';
import { extractTypeParameters } from './type-parameter';

export function buildOverload(
  node: FunctionDeclaration | ConstructorDeclaration,
): ReferenceOverload {
  return {
    parameters: extractParameters(node, node.parameters),
    returnType: buildTypeTokens(node.type),
    signature: stripBody(node.getText()),
    typeParameters: extractTypeParameters(node.typeParameters),
  };
}

export function buildCallSignature(
  node: SignatureDeclaration | MethodSignature,
): ReferenceCallSignature {
  return {
    parameters: extractParameters(node, node.parameters),
    returnType: buildTypeTokens(node.type),
    signature: stripBody(node.getText()).replace(/;$/, ''),
    typeParameters: extractTypeParameters(node.typeParameters),
  };
}

function stripBody(text: string): string {
  const braceIndex = text.indexOf('{');
  if (braceIndex === -1) {
    return text.trim();
  }
  return text.slice(0, braceIndex).trim();
}
