import type { DecorationOptions, TextEditor } from 'vscode';
import type { Decorator } from './type';

import { MarkdownString, Range, ThemeColor, window } from 'vscode';

import {
  collectUntranslatedEntries,
  isLocaleFile,
  resolveProject,
} from '../core';
import { dirname } from 'node:path';

export function createUntranslatedDecorator(): Decorator {
  const decorationType = window.createTextEditorDecorationType({
    after: {
      color: new ThemeColor('descriptionForeground'),
      contentText: 'untranslated',
      fontStyle: 'italic',
      margin: '0 0 0 2ch',
    },
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
    const hoverMessage = new MarkdownString(
      'Untranslated. `t()` falls back to the source string.',
    );
    const options: DecorationOptions[] = collectUntranslatedEntries(
      document.getText(),
    ).map((entry) => {
      const line = document.lineAt(document.positionAt(entry.offset).line);
      return {
        hoverMessage,
        range: new Range(
          line.range.start.translate(0, line.firstNonWhitespaceCharacterIndex),
          line.range.end,
        ),
      };
    });
    editor.setDecorations(decorationType, options);
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
