import { RelativePattern, Uri, commands, window, workspace } from 'vscode';

import { resolveProject, toLocaleCodeError } from '../core';
import { runCliCommand } from './cli';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

export function createAddLocaleCommand(): () => Promise<void> {
  return async () => {
    const path = window.activeTextEditor?.document.uri.fsPath;
    const project =
      path === undefined ? undefined : await resolveProject(dirname(path));
    if (project === undefined) {
      return;
    }
    const { compiler, config, root } = project;
    const picked = await window.showInputBox({
      placeHolder: 'sv',
      prompt: 'Locale code',
      title: 'Add locale',
      validateInput: (value) => toLocaleCodeError(compiler, value),
    });
    const locale = picked?.trim();
    if (locale === undefined || locale === '') {
      return;
    }
    const localePath = join(root, config.localesDir, `${locale}.json`);
    const wasCreated = waitForFile(localePath);
    void runCliCommand({
      commandArguments: [
        'add',
        locale,
      ],
      message: `Adding ${locale}`,
      root,
    }).catch(() => undefined);
    if (!(await wasCreated)) {
      return;
    }
    await commands.executeCommand('yapyak.openLocale', {
      locale,
      localesDir: config.localesDir,
      root,
    });
  };
}

const CREATE_TIMEOUT_MILLISECONDS = 20_000;

function waitForFile(path: string): Promise<boolean> {
  if (existsSync(path)) {
    return Promise.resolve(true);
  }
  const watcher = workspace.createFileSystemWatcher(
    new RelativePattern(Uri.file(dirname(path)), basename(path)),
  );
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      resolve(false);
    }, CREATE_TIMEOUT_MILLISECONDS);
    watcher.onDidCreate(() => {
      clearTimeout(timer);
      resolve(true);
    });
  }).finally(() => {
    watcher.dispose();
  });
}
