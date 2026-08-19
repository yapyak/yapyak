import { Position, Range, Uri, window, workspace } from 'vscode';

import { collectUntranslatedEntries } from '../core';
import { join } from 'node:path';

export type OpenLocaleRequest = {
  locale: string;
  localesDir: string;
  root: string;
};

export function createOpenLocaleCommand(): (
  request: OpenLocaleRequest | undefined,
) => Promise<void> {
  return async (request) => {
    if (request === undefined) {
      return;
    }
    const document = await workspace.openTextDocument(
      Uri.file(
        join(request.root, request.localesDir, `${request.locale}.json`),
      ),
    );
    const entry = collectUntranslatedEntries(document.getText())[0];
    const position =
      entry === undefined
        ? new Position(0, 0)
        : document.positionAt(entry.offset);
    const editor = await window.showTextDocument(document, {
      selection: new Range(position, position),
    });
    editor.revealRange(new Range(position, position));
  };
}
