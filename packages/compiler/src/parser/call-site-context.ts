import * as ts from 'typescript';

export interface CallSiteContext {
  componentName?: string;
  enclosingFunction?: string;
  enclosingHook?: string;
  enclosingJsx?: string;
}

const HOC_NAMES = new Set(['forwardRef', 'lazy', 'memo', 'observer']);

export function resolveCallSiteContext(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): CallSiteContext {
  const result: CallSiteContext = {};
  let current: ts.Node | undefined = node.parent;

  while (current && !ts.isSourceFile(current)) {
    if (!result.enclosingJsx) {
      const jsxTag = readJsxElementTag(current, sourceFile);
      if (jsxTag) {
        result.enclosingJsx = jsxTag;
      }
    }

    const fnName = readFunctionName(current);
    if (fnName) {
      if (!result.enclosingFunction) {
        result.enclosingFunction = fnName;
      }
      if (!result.enclosingHook && isHookName(fnName)) {
        result.enclosingHook = fnName;
      }
      if (!result.componentName && isComponentName(fnName)) {
        result.componentName = fnName;
      }
    }

    current = current.parent;
  }

  return result;
}

function readJsxElementTag(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): string | undefined {
  if (ts.isJsxElement(node)) {
    return readJsxTagName(node.openingElement.tagName, sourceFile);
  }
  if (ts.isJsxSelfClosingElement(node)) {
    return readJsxTagName(node.tagName, sourceFile);
  }
  return undefined;
}

function readJsxTagName(
  tagName: ts.JsxTagNameExpression,
  sourceFile: ts.SourceFile,
): string | undefined {
  if (ts.isIdentifier(tagName)) {
    return tagName.text;
  }
  if (ts.isPropertyAccessExpression(tagName)) {
    return tagName.getText(sourceFile);
  }
  return undefined;
}

function readFunctionName(node: ts.Node): string | undefined {
  if (ts.isFunctionDeclaration(node)) {
    return node.name?.text;
  }
  if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
    return node.name.text;
  }
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    return readFunctionExpressionName(node);
  }
  return undefined;
}

function readFunctionExpressionName(
  node: ts.ArrowFunction | ts.FunctionExpression,
): string | undefined {
  if (ts.isFunctionExpression(node) && node.name) {
    return node.name.text;
  }
  const parent = node.parent;
  if (!parent) {
    return undefined;
  }
  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
    return parent.name.text;
  }
  if (ts.isCallExpression(parent) && ts.isIdentifier(parent.expression)) {
    if (!HOC_NAMES.has(parent.expression.text)) {
      return undefined;
    }
    const callParent = parent.parent;
    if (
      callParent &&
      ts.isVariableDeclaration(callParent) &&
      ts.isIdentifier(callParent.name)
    ) {
      return callParent.name.text;
    }
  }
  return undefined;
}

function isComponentName(name: string): boolean {
  const firstChar = name[0];
  return firstChar !== undefined && firstChar >= 'A' && firstChar <= 'Z';
}

function isHookName(name: string): boolean {
  if (!name.startsWith('use')) {
    return false;
  }
  if (name.length === 3) {
    return false;
  }
  const fourthChar = name[3];
  return fourthChar !== undefined && fourthChar >= 'A' && fourthChar <= 'Z';
}
