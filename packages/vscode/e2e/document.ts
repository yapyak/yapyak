import type { TextEditor } from 'vscode';

import { Uri, window, workspace } from 'vscode';

import { FIXTURE_ROOT } from './fixture-root';
import { join } from 'node:path';

export async function openDocument(path: string): Promise<TextEditor> {
  const document = await workspace.openTextDocument(
    Uri.file(join(FIXTURE_ROOT, path)),
  );
  return window.showTextDocument(document);
}
