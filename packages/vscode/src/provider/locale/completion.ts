import type { CompletionItemProvider } from 'vscode';

import { CompletionItem, CompletionItemKind, SnippetString } from 'vscode';

import {
  buildLocaleCompletions,
  collectLocaleEntries,
  isLocaleFile,
  resolveProject,
  toLocaleCode,
} from '../../core';
import { dirname } from 'node:path';

export function createLocaleCompletionProvider(): CompletionItemProvider {
  return {
    async provideCompletionItems(document, position) {
      const path = document.uri.fsPath;
      const project = await resolveProject(dirname(path));
      if (
        project === undefined ||
        !isLocaleFile(project.root, project.config.localesDir, path)
      ) {
        return [];
      }
      const offset = document.offsetAt(position);
      const entry = collectLocaleEntries(document.getText()).find(
        (candidate) =>
          offset >= candidate.offset &&
          offset <= candidate.offset + candidate.length,
      );
      if (entry === undefined) {
        return [];
      }
      return buildLocaleCompletions(project.compiler, {
        locale: toLocaleCode(path),
        source: entry.source,
      }).map((completion) => {
        const item = new CompletionItem(
          completion.label,
          CompletionItemKind.Snippet,
        );
        item.detail = completion.detail;
        item.insertText = new SnippetString(completion.insertText);
        return item;
      });
    },
  };
}
