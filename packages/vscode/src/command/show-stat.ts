import type { QuickPickItem } from 'vscode';
import type { TranslationProgress } from 'yapyak/compiler/internal';

import { QuickPickItemKind, commands, window } from 'vscode';

import {
  buildTranslationStats,
  readProjectLocales,
  readProjectProgress,
  resolveProject,
  resolveProjectMessages,
} from '../core';
import { dirname } from 'node:path';

type StatItem = QuickPickItem & {
  error?: TranslationProgress['errors'][number];
  locale?: string;
};

export function createShowStatsCommand(): () => Promise<void> {
  return async () => {
    const path = window.activeTextEditor?.document.uri.fsPath;
    const project =
      path === undefined ? undefined : await resolveProject(dirname(path));
    if (project === undefined) {
      return;
    }
    const stats = buildTranslationStats(project.compiler, {
      ...readProjectLocales(project),
      messages: resolveProjectMessages(project).messages,
    });
    const items: StatItem[] = [];
    for (const error of readProjectProgress(project)?.errors ?? []) {
      items.push({
        description: error.message,
        error,
        label: `$(warning) ${error.locale} · ${error.source}`,
      });
    }
    if (items.length > 0) {
      items.push({
        kind: QuickPickItemKind.Separator,
        label: '',
      });
    }
    for (const stat of stats) {
      const total = stat.missing + stat.translated;
      const percent =
        total === 0 ? 100 : Math.round((stat.translated / total) * 100);
      items.push({
        description: `${percent}%  ·  ${stat.translated} / ${total}`,
        label: `$(globe) ${stat.locale}`,
        locale: stat.locale,
      });
    }
    if (stats.length > 0) {
      items.push({
        kind: QuickPickItemKind.Separator,
        label: '',
      });
    }
    items.push({
      label: '$(add) Add locale…',
    });
    const picked = await window.showQuickPick(items, {
      title: 'yapyak translations',
    });
    if (picked === undefined) {
      return;
    }
    if (picked.error !== undefined) {
      await commands.executeCommand('yapyak.openTranslation', {
        fileId: picked.error.fileId,
        locale: picked.error.locale,
        localesDir: project.config.localesDir,
        root: project.root,
        source: picked.error.source,
      });
      return;
    }
    if (picked.locale === undefined) {
      await commands.executeCommand('yapyak.addLocale');
      return;
    }
    await commands.executeCommand('yapyak.openLocale', {
      locale: picked.locale,
      localesDir: project.config.localesDir,
      root: project.root,
    });
  };
}
