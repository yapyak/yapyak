import { Range, Uri, window, workspace } from 'vscode';

import { resolveEntryOffset } from '../core';
import { join } from 'node:path';

export type OpenTranslationRequest = {
  fileId: string;
  locale: string;
  localesDir: string;
  root: string;
  source: string;
};

export function createOpenTranslationCommand(): (
  request: OpenTranslationRequest | undefined,
) => Promise<void> {
  return async (request) => {
    if (request?.root === undefined) {
      return;
    }
    const path = join(
      request.root,
      request.localesDir,
      `${request.locale}.json`,
    );
    let document: Awaited<ReturnType<typeof workspace.openTextDocument>>;
    try {
      document = await workspace.openTextDocument(Uri.file(path));
    } catch {
      window.showErrorMessage(`yapyak: could not open ${path}.`);
      return;
    }
    const offset = resolveEntryOffset(
      document.getText(),
      request.fileId,
      request.source,
    );
    const position = document.positionAt(offset);
    await window.showTextDocument(document, {
      selection: new Range(position, position),
    });
  };
}
