import type {
  ClassDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  Node,
  SourceFile,
  TypeAliasDeclaration,
  TypeNode,
  VariableStatement,
} from 'typescript';
import type { ExportKind } from '../../access';
import type {
  ReferenceExport,
  ReferenceMember,
  ReferenceSymbolBase,
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
): ReferenceSymbolBase {
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
  return {
    ...buildBase(name, 'function', node, input),
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
  const isTypeLiteral = ts.isTypeLiteralNode(node.type);
  const members = isTypeLiteral
    ? extractMembers(node.type.members, {
        packageDir: input.packageDir,
      })
    : [];
  const callSignatures = isTypeLiteral
    ? node.type.members
        .filter(ts.isCallSignatureDeclaration)
        .map(buildCallSignature)
    : [];
  return {
    ...buildBase(name, 'type', node, input),
    callSignatures,
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
  const members =
    declaration?.type === undefined
      ? []
      : collectInlineTypeMembers(declaration.type, input.packageDir);
  return {
    ...buildBase(name, 'variable', node, input),
    kind: 'variable',
    members,
    type: typeTokens,
  };
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
