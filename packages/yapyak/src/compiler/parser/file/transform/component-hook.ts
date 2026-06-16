import type MagicString from 'magic-string';
import type { ComponentHook, Fragment } from '../../../../processor';
import type { ParsedCallSite } from '../extract';

import ts from 'typescript';

import { getScriptKind } from '../../script-kind';
import { extractPrologueDirectives } from './directive';

export type InjectComponentHooksInput = {
  callSites: ParsedCallSite[];
  componentHook: ComponentHook;
  fileId: string;
  fragments: Fragment[];
  invocation: string;
  magicString: MagicString;
  source: string;
};

export function injectComponentHooks(input: InjectComponentHooksInput): void {
  const { componentHook, source } = input;
  if (componentHook.eligibilityDirective !== undefined) {
    const directives = extractPrologueDirectives(source);
    if (!directives.includes(componentHook.eligibilityDirective)) {
      return;
    }
  }
  for (const fragment of input.fragments) {
    if (fragment.kind !== 'script') {
      continue;
    }
    const sourceFile = ts.createSourceFile(
      input.fileId,
      fragment.code,
      ts.ScriptTarget.ESNext,
      true,
      getScriptKind(input.fileId, fragment.lang),
    );
    const insertionPositions = new Set<number>();
    walkForInjectionTargets(
      sourceFile,
      sourceFile,
      fragment.originalOffset,
      input.callSites,
      componentHook.namePattern,
      insertionPositions,
    );
    for (const position of insertionPositions) {
      input.magicString.appendLeft(position, `${input.invocation}();`);
    }
  }
}

function walkForInjectionTargets(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  fragmentOffset: number,
  callSites: ParsedCallSite[],
  namePattern: RegExp,
  insertionPositions: Set<number>,
): void {
  if (ts.isFunctionDeclaration(node) && node.name && node.body) {
    if (
      namePattern.test(node.name.text) &&
      hasCallSite(node, sourceFile, fragmentOffset, callSites)
    ) {
      insertionPositions.add(
        node.body.getStart(sourceFile) + 1 + fragmentOffset,
      );
    }
  }
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
    const initializer = node.initializer;
    if (
      initializer &&
      (ts.isArrowFunction(initializer) ||
        ts.isFunctionExpression(initializer)) &&
      ts.isBlock(initializer.body)
    ) {
      if (
        namePattern.test(node.name.text) &&
        hasCallSite(initializer, sourceFile, fragmentOffset, callSites)
      ) {
        insertionPositions.add(
          initializer.body.getStart(sourceFile) + 1 + fragmentOffset,
        );
      }
    }
  }
  ts.forEachChild(node, (child) => {
    walkForInjectionTargets(
      child,
      sourceFile,
      fragmentOffset,
      callSites,
      namePattern,
      insertionPositions,
    );
  });
}

function hasCallSite(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  fragmentOffset: number,
  callSites: ParsedCallSite[],
): boolean {
  const start = node.getStart(sourceFile) + fragmentOffset;
  const end = node.getEnd() + fragmentOffset;
  for (const callSite of callSites) {
    if (
      callSite.range.start.offset >= start &&
      callSite.range.end.offset <= end
    ) {
      return true;
    }
  }
  return false;
}
