import type {
  ClassDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  Node,
  SourceFile,
  TypeAliasDeclaration,
  VariableStatement,
} from 'typescript';
import type {
  ReferenceExport,
  ReferenceLocation,
  ReferenceSymbolBase,
} from './type';

import ts from 'typescript';

import { extractJsDoc } from './jsdoc';
import { extractMembers } from './member';
import { buildCallSignature, buildOverload } from './signature';
import { buildTypeTokens } from './type-token';
import { relative } from 'node:path';

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
  node: Node,
  input: BuildSymbolInput,
): ReferenceSymbolBase {
  const jsDoc = extractJsDoc(node);
  return {
    deprecated: jsDoc.deprecated,
    description: jsDoc.description,
    examples: jsDoc.examples,
    location: buildLocation(node, input),
    name,
    remarks: jsDoc.remarks,
    seeAlso: jsDoc.seeAlso,
    shape: jsDoc.shape,
    tags: jsDoc.tags,
    throws: jsDoc.throws,
  };
}

function buildLocation(node: Node, input: BuildSymbolInput): ReferenceLocation {
  const { sourceFile, packageDir } = input;
  const start = node.getStart();
  const position = sourceFile.getLineAndCharacterOfPosition(start);
  return {
    column: position.character + 1,
    file: relative(packageDir, sourceFile.fileName).split('\\').join('/'),
    line: position.line + 1,
  };
}

function buildFunctionSymbol(
  name: string,
  node: FunctionDeclaration,
  input: BuildSymbolInput,
): ReferenceExport {
  return {
    ...buildBase(name, node, input),
    kind: 'function',
    members: [],
    overloads: [
      buildOverload(node),
    ],
  };
}

function buildTypeAliasSymbol(
  name: string,
  node: TypeAliasDeclaration,
  input: BuildSymbolInput,
): ReferenceExport {
  const members = ts.isTypeLiteralNode(node.type)
    ? extractMembers(node.type.members)
    : [];
  return {
    ...buildBase(name, node, input),
    kind: 'type',
    members,
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
  const members = extractMembers(node.members);
  return {
    ...buildBase(name, node, input),
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
  const typeTokens =
    declaration?.type === undefined
      ? declaration?.initializer === undefined
        ? []
        : [
            {
              kind: 'text' as const,
              text: declaration.initializer.getText(),
            },
          ]
      : buildTypeTokens(declaration.type);
  return {
    ...buildBase(name, node, input),
    kind: 'variable',
    type: typeTokens,
  };
}

function buildClassSymbol(
  name: string,
  node: ClassDeclaration,
  input: BuildSymbolInput,
): ReferenceExport {
  return {
    ...buildBase(name, node, input),
    kind: 'class',
    members: [],
    signature: `class ${name}`,
  } as ReferenceExport;
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
