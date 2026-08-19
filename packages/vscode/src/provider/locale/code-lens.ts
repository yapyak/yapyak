import type { CodeLensProvider } from 'vscode';

import { CodeLens, Range } from 'vscode';

import { isCliRunning, onDidChangeCliRun } from '../../command';
import {
  collectLocaleEntries,
  collectUntranslatedEntries,
  isLocaleFile,
  resolveProject,
  toLocaleCode,
} from '../../core';
import { dirname } from 'node:path';

export function createLocaleCodeLensProvider(): CodeLensProvider {
  return {
    onDidChangeCodeLenses: onDidChangeCliRun,
    async provideCodeLenses(document) {
      const path = document.uri.fsPath;
      const project = await resolveProject(dirname(path));
      if (
        project === undefined ||
        project.config.translator === undefined ||
        !isLocaleFile(project.root, project.config.localesDir, path)
      ) {
        return [];
      }
      const { root } = project;
      const text = document.getText();
      const untranslated = collectUntranslatedEntries(text);
      const total = collectLocaleEntries(text).length;
      const locale = toLocaleCode(path);
      const range = new Range(0, 0, 0, 0);
      if (isCliRunning(root)) {
        return [
          new CodeLens(range, {
            command: '',
            title: 'Translating…',
          }),
        ];
      }
      const lenses: CodeLens[] = [];
      if (untranslated.length > 0) {
        lenses.push(
          new CodeLens(range, {
            arguments: [
              {
                locale,
                root,
              },
            ],
            command: 'yapyak.translate',
            title: `Translate (${untranslated.length})`,
          }),
        );
      }
      if (total > untranslated.length) {
        lenses.push(
          new CodeLens(range, {
            command: 'yapyak.retranslateLocale',
            title: `Retranslate all (${total})`,
          }),
        );
      }
      return lenses;
    },
  };
}
