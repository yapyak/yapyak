import { StatusBarAlignment, window } from 'vscode';

import {
  MINIMUM_YAPYAK_VERSION,
  buildStatusText,
  buildTranslationStats,
  buildUnsupportedStatusText,
  findProjectRoot,
  findUnsupportedYapyakVersion,
  readProjectLocales,
  readProjectProgress,
  resolveProject,
  resolveProjectMessages,
} from '../core';
import { dirname } from 'node:path';

export type UntranslatedStatus = {
  dispose: () => void;
  render: () => void;
};

const PRIORITY = 100;
const RUNNING_POLL_MILLISECONDS = 1000;
const warnedRoots = new Set<string>();

export function createUntranslatedStatus(): UntranslatedStatus {
  const statusBarItem = window.createStatusBarItem(
    'yapyak.translations',
    StatusBarAlignment.Right,
    PRIORITY,
  );
  statusBarItem.name = 'yapyak translations';
  let timer: ReturnType<typeof setTimeout> | undefined;

  const applyUnsupported = (directory: string): void => {
    const found = findUnsupportedYapyakVersion(directory);
    if (found === undefined) {
      statusBarItem.hide();
      return;
    }
    statusBarItem.text = buildUnsupportedStatusText(
      found,
      MINIMUM_YAPYAK_VERSION,
    );
    statusBarItem.command = undefined;
    statusBarItem.show();
    const root = findProjectRoot(directory);
    if (root === undefined || warnedRoots.has(root)) {
      return;
    }
    warnedRoots.add(root);
    window.showWarningMessage(
      `yapyak: this extension needs yapyak ${MINIMUM_YAPYAK_VERSION} or later; this project has ${found}.`,
    );
  };

  const applyStatus = async (): Promise<void> => {
    const path = window.activeTextEditor?.document.uri.fsPath;
    if (path === undefined) {
      statusBarItem.hide();
      return;
    }
    const directory = dirname(path);
    const project = await resolveProject(directory);
    if (project === undefined) {
      applyUnsupported(directory);
      return;
    }
    statusBarItem.command = 'yapyak.showStats';
    const stats = buildTranslationStats(project.compiler, {
      ...readProjectLocales(project),
      messages: resolveProjectMessages(project).messages,
    });
    const missing = stats.reduce((sum, stat) => sum + stat.missing, 0);
    const progress = readProjectProgress(project);
    const translating =
      progress !== undefined && project.compiler.isTranslationRunning(progress)
        ? progress.total - progress.translated
        : undefined;
    statusBarItem.text = buildStatusText({
      failed: progress?.errors.length ?? 0,
      missing,
      ...(translating === undefined
        ? {}
        : {
            translating,
          }),
    });
    statusBarItem.show();
    if (translating !== undefined) {
      timer = setTimeout(render, RUNNING_POLL_MILLISECONDS);
    }
  };

  const render = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    void applyStatus().catch(() => {
      statusBarItem.hide();
    });
  };

  return {
    dispose() {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      statusBarItem.dispose();
    },
    render,
  };
}
