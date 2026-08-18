import type { DefinitionProvider } from 'vscode';

import { Range, Uri } from 'vscode';

import {
  collectLocaleEntries,
  findEntryAt,
  findFileKeyAt,
  isLocaleFile,
  resolveProject,
  resolveProjectMessages,
} from '../../core';
import { toRange } from '../../range';
import { dirname, join } from 'node:path';

export function createLocaleDefinitionProvider(): DefinitionProvider {
  return {
    async provideDefinition(document, position) {
      const path = document.uri.fsPath;
      const project = await resolveProject(dirname(path));
      if (
        project === undefined ||
        !isLocaleFile(project.root, project.config.localesDir, path)
      ) {
        return undefined;
      }
      const { root } = project;
      const text = document.getText();
      const entries = collectLocaleEntries(text);
      const offset = document.offsetAt(position);
      const fileKey = findFileKeyAt(entries, offset);
      if (fileKey !== undefined) {
        return [
          {
            originSelectionRange: toRange(
              document,
              fileKey.offset,
              fileKey.offset + fileKey.fileId.length + 2,
            ),
            targetRange: new Range(0, 0, 0, 0),
            targetUri: Uri.file(join(root, fileKey.fileId)),
          },
        ];
      }
      const line = document.lineAt(position.line);
      const entry = findEntryAt({
        entries,
        lineEnd: document.offsetAt(line.range.end),
        lineStart: document.offsetAt(line.range.start),
        offset,
      });
      if (entry === undefined) {
        return undefined;
      }
      const { messages } = resolveProjectMessages(project);
      const message = messages.find(
        (candidate) =>
          candidate.source === entry.source &&
          candidate.context === entry.context,
      );
      const location = message?.locations.find(
        (candidate) => candidate.fileId === entry.fileId,
      );
      if (location === undefined) {
        return undefined;
      }
      const { end, start } = location.range;
      return [
        {
          originSelectionRange: toRange(
            document,
            entry.keyOffset,
            entry.offset + entry.length + 1,
          ),
          targetRange: new Range(
            start.line - 1,
            start.column - 1,
            end.line - 1,
            end.column - 1,
          ),
          targetUri: Uri.file(join(root, location.fileId)),
        },
      ];
    },
  };
}
