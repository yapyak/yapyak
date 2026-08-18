import type { HoverProvider } from 'vscode';

import { Hover, MarkdownString, Range } from 'vscode';

import {
  buildHoverMarkdown,
  buildTranslationTable,
  findMessageAt,
  readProjectLocales,
  resolveProject,
} from '../../core';
import { dirname, relative } from 'node:path';

export function createSourceHoverProvider(): HoverProvider {
  return {
    async provideHover(document, position) {
      const path = document.uri.fsPath;
      const project = await resolveProject(dirname(path));
      if (project === undefined) {
        return undefined;
      }
      const { compiler, config, root } = project;
      const fileId = relative(root, path).replaceAll('\\', '/');
      const extraction = compiler.extractFile(fileId, document.getText(), {
        processors: config.processors,
      });
      const found = findMessageAt(
        extraction.messages,
        document.offsetAt(position),
      );
      if (found === undefined) {
        return undefined;
      }
      const message = {
        ...(found.message.context === undefined
          ? {}
          : {
              context: found.message.context,
            }),
        fileId,
        source: found.message.source,
      };
      const rows = buildTranslationTable(compiler, {
        ...message,
        ...readProjectLocales(project),
      });
      const markdown = buildHoverMarkdown({
        ...message,
        localesDir: config.localesDir,
        root,
        rows,
      });
      const content = new MarkdownString(markdown);
      content.supportThemeIcons = true;
      content.isTrusted = {
        enabledCommands: [
          'yapyak.openTranslation',
        ],
      };
      const { end, start } = found.location.range;
      return new Hover(
        content,
        new Range(
          start.line - 1,
          start.column - 1,
          end.line - 1,
          end.column - 1,
        ),
      );
    },
  };
}
