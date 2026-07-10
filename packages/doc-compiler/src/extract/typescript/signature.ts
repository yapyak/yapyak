import type {
  ConstructorDeclaration,
  FunctionDeclaration,
  MethodSignature,
  Node,
  SignatureDeclaration,
} from '@typescript/typescript6';
import type { ReferenceCallSignature, ReferenceOverload } from './type';

import { extractParameters } from './parameter';
import { extractTypeParameters } from './type-parameter';
import { buildTypeTokens } from './type-token';

export function buildOverload(
  node: FunctionDeclaration | ConstructorDeclaration,
): ReferenceOverload {
  return {
    parameters: extractParameters(node, node.parameters),
    returnType: buildTypeTokens(node.type),
    signature: stripBody(node, node.body),
    typeParameters: extractTypeParameters(node.typeParameters),
  };
}

export function buildCallSignature(
  node: SignatureDeclaration | MethodSignature,
): ReferenceCallSignature {
  return {
    parameters: extractParameters(node, node.parameters),
    returnType: buildTypeTokens(node.type),
    signature: stripBody(node).replace(/;$/, ''),
    typeParameters: extractTypeParameters(node.typeParameters),
  };
}

export function buildMethodOverload(node: MethodSignature): ReferenceOverload {
  return {
    parameters: extractParameters(node, node.parameters),
    returnType: buildTypeTokens(node.type),
    signature: stripBody(node).replace(/;$/, ''),
    typeParameters: extractTypeParameters(node.typeParameters),
  };
}

function stripBody(node: Node, body?: Node): string {
  const text = node.getText();
  if (body === undefined) {
    return text.trim();
  }
  const offset = body.getStart() - node.getStart();
  if (offset < 0 || offset > text.length) {
    return text.trim();
  }
  return text.slice(0, offset).trim();
}
