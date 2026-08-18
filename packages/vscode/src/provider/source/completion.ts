import type { CompletionItemProvider } from 'vscode';

import { CompletionItem, CompletionItemKind, SnippetString } from 'vscode';

import {
  SOURCE_LANGUAGES,
  buildSourceCompletions,
  findMessageAt,
  resolveProject,
} from '../../core';
import { dirname, relative } from 'node:path';

export function createSourceCompletionProvider(): CompletionItemProvider {
  return {
    async provideCompletionItems(document, position) {
      if (!SOURCE_LANGUAGES.includes(document.languageId)) {
        return [];
      }
      const path = document.uri.fsPath;
      const project = await resolveProject(dirname(path));
      if (project === undefined) {
        return [];
      }
      const { compiler, config, root } = project;
      const text = document.getText();
      const { messages } = compiler.extractFile(
        relative(root, path).replaceAll('\\', '/'),
        text,
        {
          processors: config.processors,
        },
      );
      const offset = document.offsetAt(position);
      const found = findMessageAt(messages, offset);
      if (found === undefined) {
        return [];
      }
      const start = found.location.range.start.offset + 1;
      const end = found.location.range.end.offset - 1;
      if (offset < start || offset > end) {
        return [];
      }
      return buildSourceCompletions(text.slice(start, end), offset - start).map(
        (completion) => {
          const item = new CompletionItem(
            completion.label,
            CompletionItemKind.Snippet,
          );
          item.detail = completion.detail;
          item.insertText = new SnippetString(completion.insertText);
          return item;
        },
      );
    },
  };
}
