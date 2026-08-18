import { EventEmitter, ProgressLocation, window } from 'vscode';

import { resolveCliPath, runCli, toCliErrorDetail } from '../core';

export type RunCliCommandInput = {
  commandArguments: string[];
  message: string;
  root: string;
};

const runningRoots = new Set<string>();
const runEmitter = new EventEmitter<void>();

export const onDidChangeCliRun = runEmitter.event;

export async function runCliCommand(input: RunCliCommandInput): Promise<void> {
  const cliPath = resolveCliPath(input.root);
  if (cliPath === undefined) {
    window.showErrorMessage(
      'yapyak: the yapyak CLI was not found in this workspace.',
    );
    return;
  }
  if (runningRoots.has(input.root)) {
    window.showWarningMessage('yapyak: a translation is already running.');
    return;
  }
  const document = window.activeTextEditor?.document;
  if (document?.isDirty === true) {
    await document.save();
  }
  runningRoots.add(input.root);
  runEmitter.fire();
  try {
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: 'yapyak',
      },
      async (progress) => {
        progress.report({
          message: input.message,
        });
        const result = await runCli(
          cliPath,
          input.root,
          input.commandArguments,
          (line) => {
            progress.report({
              message: line,
            });
          },
        );
        if (result.code === 0) {
          return;
        }
        const detail = toCliErrorDetail(result);
        window.showErrorMessage(
          detail === '' ? 'yapyak: the command failed.' : `yapyak: ${detail}`,
        );
      },
    );
  } finally {
    runningRoots.delete(input.root);
    runEmitter.fire();
  }
}

export function isCliRunning(root: string): boolean {
  return runningRoots.has(root);
}
