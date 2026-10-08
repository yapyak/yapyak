import type {
  ArrowFunctionExpression,
  Function as FunctionNode,
  JSXElementName,
  Node,
} from 'oxc-parser';
import type { SourceFile } from './source-file';

export type CallSiteContext = {
  enclosingAttribute?: string;
  enclosingComponent?: string;
  enclosingElement?: string;
  snippet?: string;
};

const HOC_NAMES = new Set([
  'forwardRef',
  'lazy',
  'memo',
  'observer',
]);

export function resolveCallSiteContext(
  node: Node,
  sourceFile: SourceFile,
): CallSiteContext {
  const result: CallSiteContext = {};
  let current = node.parent;

  while (current && current.type !== 'Program') {
    if (!result.enclosingAttribute && current.type === 'JSXAttribute') {
      result.enclosingAttribute = sourceFile.code.slice(
        current.name.start,
        current.name.end,
      );
    }

    if (!result.enclosingElement && current.type === 'JSXElement') {
      const jsxTag = readJsxTagName(current.openingElement.name, sourceFile);
      if (jsxTag) {
        result.enclosingElement = jsxTag;
        result.snippet = sourceFile.code.slice(current.start, current.end);
      }
    }

    const functionName = readFunctionName(current);
    if (
      functionName &&
      !result.enclosingComponent &&
      isComponentName(functionName)
    ) {
      result.enclosingComponent = functionName;
    }

    current = current.parent;
  }

  return result;
}

function readJsxTagName(
  tagName: JSXElementName,
  sourceFile: SourceFile,
): string | undefined {
  if (tagName.type === 'JSXIdentifier') {
    return tagName.name;
  }
  if (tagName.type === 'JSXMemberExpression') {
    return sourceFile.code.slice(tagName.start, tagName.end);
  }
  return undefined;
}

function readFunctionName(node: Node): string | undefined {
  if (node.type === 'FunctionDeclaration') {
    return node.id?.name;
  }
  if (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionExpression'
  ) {
    return readFunctionExpressionName(node);
  }
  return undefined;
}

function readFunctionExpressionName(
  node: ArrowFunctionExpression | FunctionNode,
): string | undefined {
  if (node.id) {
    return node.id.name;
  }
  const parent = node.parent;
  if (!parent) {
    return undefined;
  }
  if (
    (parent.type === 'MethodDefinition' && parent.kind === 'method') ||
    (parent.type === 'Property' && parent.method)
  ) {
    return !parent.computed && parent.key.type === 'Identifier'
      ? parent.key.name
      : undefined;
  }
  if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
    return parent.id.name;
  }
  if (parent.type === 'CallExpression' && parent.callee.type === 'Identifier') {
    if (!HOC_NAMES.has(parent.callee.name)) {
      return undefined;
    }
    const callParent = parent.parent;
    if (
      callParent?.type === 'VariableDeclarator' &&
      callParent.id.type === 'Identifier'
    ) {
      return callParent.id.name;
    }
  }
  return undefined;
}

function isComponentName(name: string): boolean {
  const firstCharacter = name[0];
  return (
    firstCharacter !== undefined &&
    firstCharacter >= 'A' &&
    firstCharacter <= 'Z'
  );
}
