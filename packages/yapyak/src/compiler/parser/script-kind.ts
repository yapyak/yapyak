import type { Fragment } from './fragment';

import * as ts from 'typescript';

export function getScriptKind(
  fileId: string,
  lang: Fragment['lang'],
): ts.ScriptKind {
  if (fileId.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (fileId.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (lang === 'js') {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}
