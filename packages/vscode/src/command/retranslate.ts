import { commands, window } from 'vscode';

import { resolveProject } from '../core';
import { runCliCommand } from './cli';

const MESSAGE_TIMEOUT_MILLISECONDS = 5000;

export type RetranslateRequest = {
  context?: string;
  fileId?: string;
  locale?: string;
  root: string;
  source: string;
  translated: boolean;
};

export function createRetranslateCommand(): (
  request: RetranslateRequest | undefined,
) => Promise<void> {
  return async (request) => {
    if (request?.root === undefined) {
      return;
    }
    const commandArguments = [
      'retranslate',
      request.source,
    ];
    if (request.locale !== undefined) {
      commandArguments.push('--locale', request.locale);
    }
    if (request.context !== undefined) {
      commandArguments.push('--as', request.context);
    }
    if (request.fileId !== undefined) {
      commandArguments.push('--file', request.fileId);
    }
    await commands.executeCommand('editor.action.hideHover');
    const verb = request.translated ? 'Retranslating' : 'Translating';
    await runCliCommand({
      commandArguments,
      message:
        request.locale === undefined
          ? `${verb} "${request.source}"`
          : `${verb} "${request.source}" to ${request.locale}`,
      root: request.root,
    });
    const translation = await readTranslation(request);
    if (translation !== undefined) {
      window.setStatusBarMessage(
        `yapyak: ${request.locale} · ${translation}`,
        MESSAGE_TIMEOUT_MILLISECONDS,
      );
    }
  };
}

async function readTranslation(
  request: RetranslateRequest,
): Promise<string | undefined> {
  if (request.locale === undefined || request.fileId === undefined) {
    return undefined;
  }
  const project = await resolveProject(request.root);
  if (project === undefined) {
    return undefined;
  }
  const { compiler, config } = project;
  const localeData = compiler.readLocaleData(
    {
      locales: [
        request.locale,
      ],
      localesDir: config.localesDir,
    },
    request.root,
  );
  return compiler.findTranslation(
    localeData[request.locale]?.[request.fileId]?.[request.source],
    request.context,
  );
}
