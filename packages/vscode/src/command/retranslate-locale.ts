import { window } from 'vscode';

import {
  collectLocaleEntries,
  isLocaleFile,
  resolveProject,
  toLocaleCode,
} from '../core';
import { runCliCommand } from './cli';
import { basename, dirname } from 'node:path';

const CONFIRM = 'Retranslate';

export function createRetranslateLocaleCommand(): () => Promise<void> {
  return async () => {
    const document = window.activeTextEditor?.document;
    if (document === undefined) {
      return;
    }
    const path = document.uri.fsPath;
    const project = await resolveProject(dirname(path));
    if (project === undefined) {
      return;
    }
    const { config, root } = project;
    if (!isLocaleFile(root, config.localesDir, path)) {
      window.showErrorMessage('yapyak: open a locale file first.');
      return;
    }
    if (config.translator === undefined) {
      window.showErrorMessage('yapyak: no translator is configured.');
      return;
    }
    const locale = toLocaleCode(path);
    const total = collectLocaleEntries(document.getText()).length;
    const picked = await window.showWarningMessage(
      `Retranslate all ${total} translations in ${basename(path)}?`,
      {
        detail: 'Existing translations are replaced. This cannot be undone.',
        modal: true,
      },
      CONFIRM,
    );
    if (picked !== CONFIRM) {
      return;
    }
    await runCliCommand({
      commandArguments: [
        'translate',
        locale,
        '--force',
      ],
      message: `Retranslating ${locale}`,
      root,
    });
  };
}
