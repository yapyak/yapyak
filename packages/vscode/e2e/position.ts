import type { Position, TextDocument } from 'vscode';

export function toPosition(document: TextDocument, needle: string): Position {
  const offset = document.getText().indexOf(needle);
  if (offset === -1) {
    throw new Error(`"${needle}" is not in ${document.uri.fsPath}.`);
  }
  return document.positionAt(offset);
}
