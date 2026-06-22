import type {
  ClassDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  Node,
  SourceFile,
  TypeAliasDeclaration,
  TypeNode,
  VariableDeclaration,
  VariableStatement,
} from 'typescript';
import type { ExportKind } from '../../access';
import type {
  ReferenceCallSignature,
  ReferenceExport,
  ReferenceExportBase,
  ReferenceMember,
  TypeToken,
} from './type';

import ts from 'typescript';

import { classifyExportKind } from './classify';
import { extractJsDoc } from './jsdoc';
import { buildLocation } from './location';
import { extractMembers } from './member';
import { buildCallSignature, buildOverload } from './signature';
import { buildTypeTokens } from './type-token';

export type BuildSymbolInput = {
  name: string;
  node: Node;
  packageDir: string;
  sourceFile: SourceFile;
};

export function buildSymbol(
  input: BuildSymbolInput,
): ReferenceExport | undefined {
  const { name, node } = input;
  if (ts.isFunctionDeclaration(node)) {
    return buildFunctionSymbol(name, node, input);
  }
  if (ts.isTypeAliasDeclaration(node)) {
    return buildTypeAliasSymbol(name, node, input);
  }
  if (ts.isInterfaceDeclaration(node)) {
    return buildInterfaceSymbol(name, node, input);
  }
  if (ts.isVariableStatement(node)) {
    return buildVariableSymbol(name, node, input);
  }
  if (ts.isClassDeclaration(node)) {
    return buildClassSymbol(name, node, input);
  }
  return undefined;
}

function buildBase(
  name: string,
  baseKind: ExportKind,
  node: Node,
  input: BuildSymbolInput,
): ReferenceExportBase {
  const jsDoc = extractJsDoc(node);
  return {
    deprecated: jsDoc.deprecated,
    description: jsDoc.description,
    displayKind: classifyExportKind(name, baseKind, jsDoc.tags),
    examples: jsDoc.examples,
    location: buildLocation(node, input.sourceFile, input.packageDir),
    name,
    remarks: jsDoc.remarks,
    seeAlso: jsDoc.seeAlso,
    shape: jsDoc.shape,
    tags: jsDoc.tags,
    throws: jsDoc.throws,
  };
}

function buildFunctionSymbol(
  name: string,
  node: FunctionDeclaration,
  input: BuildSymbolInput,
): ReferenceExport {
  const overloadNodes = collectFunctionOverloads(name, node, input.sourceFile);
  const primaryNode = overloadNodes[0] ?? node;
  return {
    ...buildBase(name, 'function', primaryNode, input),
    kind: 'function',
    members: [],
    overloads: overloadNodes.map(buildOverload),
  };
}

function collectFunctionOverloads(
  name: string,
  fallback: FunctionDeclaration,
  sourceFile: SourceFile,
): FunctionDeclaration[] {
  const signatures: FunctionDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isFunctionDeclaration(statement)) {
      continue;
    }
    if (statement.name?.text !== name) {
      continue;
    }
    if (statement.body === undefined) {
      signatures.push(statement);
    }
  }
  if (signatures.length > 0) {
    return signatures;
  }
  return [
    fallback,
  ];
}

function buildTypeAliasSymbol(
  name: string,
  node: TypeAliasDeclaration,
  input: BuildSymbolInput,
): ReferenceExport {
  return {
    ...buildBase(name, 'type', node, input),
    callSignatures: collectInlineCallSignatures(node.type),
    kind: 'type',
    members: collectInlineTypeMembers(node.type, input.packageDir),
    resolvedType: buildTypeTokens(node.type),
    signature: stripModifiers(node.getText()),
  };
}

function buildInterfaceSymbol(
  name: string,
  node: InterfaceDeclaration,
  input: BuildSymbolInput,
): ReferenceExport {
  const callSignatures = node.members
    .filter(ts.isCallSignatureDeclaration)
    .map(buildCallSignature);
  const members = extractMembers(node.members, {
    packageDir: input.packageDir,
  });
  return {
    ...buildBase(name, 'interface', node, input),
    callSignatures,
    kind: 'interface',
    members,
    signature: buildInterfaceSignature(node),
  };
}

function buildVariableSymbol(
  name: string,
  node: VariableStatement,
  input: BuildSymbolInput,
): ReferenceExport {
  const declaration = node.declarationList.declarations.find(
    (candidate) =>
      ts.isIdentifier(candidate.name) && candidate.name.text === name,
  );
  return {
    ...buildBase(name, 'variable', node, input),
    kind: 'variable',
    members:
      declaration?.type === undefined
        ? []
        : collectInlineTypeMembers(declaration.type, input.packageDir),
    type: getVariableTypeTokens(declaration),
  };
}

function getVariableTypeTokens(
  declaration: VariableDeclaration | undefined,
): TypeToken[] {
  if (declaration?.type !== undefined) {
    return buildTypeTokens(declaration.type);
  }
  if (declaration?.initializer === undefined) {
    return [];
  }
  return [
    {
      kind: 'text',
      text: declaration.initializer.getText(),
    },
  ];
}

function collectInlineTypeMembers(
  typeNode: TypeNode,
  packageDir: string,
): ReferenceMember[] {
  if (ts.isTypeLiteralNode(typeNode)) {
    return extractMembers(typeNode.members, {
      packageDir,
    });
  }
  if (ts.isIntersectionTypeNode(typeNode)) {
    return typeNode.types.flatMap((part) =>
      collectInlineTypeMembers(part, packageDir),
    );
  }
  return [];
}

function collectInlineCallSignatures(
  typeNode: TypeNode,
): ReferenceCallSignature[] {
  if (ts.isTypeLiteralNode(typeNode)) {
    return typeNode.members
      .filter(ts.isCallSignatureDeclaration)
      .map(buildCallSignature);
  }
  if (ts.isIntersectionTypeNode(typeNode)) {
    return typeNode.types.flatMap(collectInlineCallSignatures);
  }
  return [];
}

function buildClassSymbol(
  name: string,
  node: ClassDeclaration,
  input: BuildSymbolInput,
): ReferenceExport {
  return {
    ...buildBase(name, 'class', node, input),
    kind: 'class',
    members: [],
    signature: `class ${name}`,
  };
}

function stripModifiers(text: string): string {
  return text.replace(/^(\s*export\s+(?:declare\s+)?)/, '').trim();
}

function buildInterfaceSignature(node: InterfaceDeclaration): string {
  const name = node.name.text;
  const typeParameters =
    node.typeParameters === undefined
      ? ''
      : `<${node.typeParameters.map((typeParameter) => typeParameter.getText()).join(', ')}>`;
  const heritage =
    node.heritageClauses === undefined
      ? ''
      : ` ${node.heritageClauses.map((clause) => clause.getText()).join(' ')}`;
  return `interface ${name}${typeParameters}${heritage}`;
}
