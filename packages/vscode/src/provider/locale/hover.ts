import type { HoverProvider } from 'vscode';

import { Hover, MarkdownString } from 'vscode';

import {
  buildLocaleHoverMarkdown,
  buildTranslationTable,
  collectLocaleEntries,
  findEntryAt,
  isLocaleFile,
  readProjectLocales,
  resolveProject,
  toLocaleCode,
} from '../../core';
import { toRange } from '../../range';
import { dirname } from 'node:path';

export function createLocaleHoverProvider(): HoverProvider {
  return {
    async provideHover(document, position) {
      const path = document.uri.fsPath;
      const project = await resolveProject(dirname(path));
      if (
        project === undefined ||
        !isLocaleFile(project.root, project.config.localesDir, path)
      ) {
        return undefined;
      }
      const { compiler, config, root } = project;
      const text = document.getText();
      const line = document.lineAt(position.line);
      const entry = findEntryAt({
        entries: collectLocaleEntries(text),
        lineEnd: document.offsetAt(line.range.end),
        lineStart: document.offsetAt(line.range.start),
        offset: document.offsetAt(position),
      });
      if (entry === undefined) {
        return undefined;
      }
      const message = {
        ...(entry.context === undefined
          ? {}
          : {
              context: entry.context,
            }),
        fileId: entry.fileId,
        source: entry.source,
      };
      const rows = buildTranslationTable(compiler, {
        ...message,
        ...readProjectLocales(project),
      });
      const markdown = buildLocaleHoverMarkdown({
        ...message,
        locale: toLocaleCode(path),
        localesDir: config.localesDir,
        root,
        rows,
        translator: config.translator !== undefined,
        value: text.slice(entry.offset, entry.offset + entry.length),
      });
      const content = new MarkdownString(markdown);
      content.supportThemeIcons = true;
      content.isTrusted = {
        enabledCommands: [
          'yapyak.openSource',
          'yapyak.retranslate',
        ],
      };
      return new Hover(
        content,
        toRange(document, entry.offset, entry.offset + entry.length),
      );
    },
  };
}
