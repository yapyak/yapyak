import type {
  ConstructorDeclaration,
  FunctionDeclaration,
  MethodSignature,
  Node,
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
    signature: stripBody(node, undefined).replace(/;$/, ''),
    typeParameters: extractTypeParameters(node.typeParameters),
  };
}

function stripBody(node: Node, body: Node | undefined): string {
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
