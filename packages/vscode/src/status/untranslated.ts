import { StatusBarAlignment, window } from 'vscode';

import {
  buildStatusText,
  buildTranslationStats,
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

export function createUntranslatedStatus(): UntranslatedStatus {
  const statusBarItem = window.createStatusBarItem(
    'yapyak.translations',
    StatusBarAlignment.Right,
    PRIORITY,
  );
  statusBarItem.name = 'yapyak translations';
  statusBarItem.command = 'yapyak.showStats';
  let timer: ReturnType<typeof setTimeout> | undefined;

  const applyStatus = async (): Promise<void> => {
    const path = window.activeTextEditor?.document.uri.fsPath;
    const project =
      path === undefined ? undefined : await resolveProject(dirname(path));
    if (project === undefined) {
      statusBarItem.hide();
      return;
    }
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
