import ts from 'typescript';

export interface CallSiteContext {
  componentName?: string;
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
    if (fnName && !result.componentName && isComponentName(fnName)) {
      result.componentName = fnName;
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
