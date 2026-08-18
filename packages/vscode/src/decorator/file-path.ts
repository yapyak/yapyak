import type { Range, TextEditor } from 'vscode';
import type { Decorator } from './type';

import { ThemeColor, window } from 'vscode';

import {
  collectFileKeys,
  collectLocaleEntries,
  isLocaleFile,
  resolveProject,
} from '../core';
import { toRange } from '../range';
import { dirname } from 'node:path';

export function createFilePathDecorator(): Decorator {
  const decorationType = window.createTextEditorDecorationType({
    color: new ThemeColor('textLink.foreground'),
  });

  const applyDecorations = async (editor: TextEditor): Promise<void> => {
    const { document } = editor;
    const project = await resolveProject(dirname(document.uri.fsPath));
    if (
      project === undefined ||
      !isLocaleFile(
        project.root,
        project.config.localesDir,
        document.uri.fsPath,
      )
    ) {
      editor.setDecorations(decorationType, []);
      return;
    }
    const ranges: Range[] = collectFileKeys(
      collectLocaleEntries(document.getText()),
    ).map((key) =>
      toRange(document, key.offset, key.offset + key.fileId.length + 2),
    );
    editor.setDecorations(decorationType, ranges);
  };

  return {
    dispose() {
      decorationType.dispose();
    },
    render(editor) {
      if (editor === undefined) {
        return;
      }
      void applyDecorations(editor).catch(() => {
        editor.setDecorations(decorationType, []);
      });
    },
  };
}
