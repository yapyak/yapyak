import { commands } from 'vscode';

import { runCliCommand } from './cli';

export type TranslateRequest = {
  locale: string;
  root: string;
};

export function createTranslateCommand(): (
  request: TranslateRequest | undefined,
) => Promise<void> {
  return async (request) => {
    if (request?.root === undefined) {
      return;
    }
    await commands.executeCommand('editor.action.hideHover');
    await runCliCommand({
      commandArguments: [
        'translate',
        request.locale,
      ],
      message: `Translating ${request.locale}`,
      root: request.root,
    });
  };
}
