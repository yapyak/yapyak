import type { TextDocument } from 'vscode';

import { Range } from 'vscode';

export function toRange(
  document: TextDocument,
  start: number,
  end: number,
): Range {
  return new Range(document.positionAt(start), document.positionAt(end));
}
