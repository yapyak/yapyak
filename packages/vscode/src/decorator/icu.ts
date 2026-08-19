import type { Range, TextEditor, TextEditorDecorationType } from 'vscode';
import type { TemplateTokenKind } from 'yapyak/compiler/internal';
import type { Decorator } from './type';

import { ThemeColor, window } from 'vscode';

import {
  SOURCE_LANGUAGES,
  collectLocaleEntries,
  isLocaleFile,
  resolveProject,
} from '../core';
import { toRange } from '../range';
import { dirname, relative } from 'node:path';

type DecoratedTokenKind = Exclude<TemplateTokenKind, 'text'>;

const TOKEN_KINDS: DecoratedTokenKind[] = [
  'slot',
  'branch',
  'keyword',
  'placeholder',
  'pound',
  'punctuation',
  'tag',
];

export function createIcuDecorator(): Decorator {
  const decorationTypes = new Map<DecoratedTokenKind, TextEditorDecorationType>(
    TOKEN_KINDS.map((kind) => [
      kind,
      window.createTextEditorDecorationType(buildRenderOptions(kind)),
    ]),
  );

  const resetDecorations = (editor: TextEditor): void => {
    for (const decorationType of decorationTypes.values()) {
      editor.setDecorations(decorationType, []);
    }
  };

  const applyDecorations = async (editor: TextEditor): Promise<void> => {
    const { document } = editor;
    const project = await resolveProject(dirname(document.uri.fsPath));
    if (project === undefined) {
      resetDecorations(editor);
      return;
    }
    const { compiler, config, root } = project;
    const rangesByKind = new Map<DecoratedTokenKind, Range[]>(
      TOKEN_KINDS.map((kind) => [
        kind,
        [],
      ]),
    );
    const collectTokens = (source: string, base: number): void => {
      for (const token of compiler.tokenizeTemplate(source)) {
        if (token.kind === 'text') {
          continue;
        }
        rangesByKind
          .get(token.kind)
          ?.push(
            toRange(
              document,
              base + token.offset,
              base + token.offset + token.length,
            ),
          );
      }
    };
    const text = document.getText();
    if (isLocaleFile(root, config.localesDir, document.uri.fsPath)) {
      for (const entry of collectLocaleEntries(text)) {
        collectTokens(
          text.slice(entry.offset, entry.offset + entry.length),
          entry.offset,
        );
      }
    } else if (SOURCE_LANGUAGES.includes(document.languageId)) {
      const fileId = relative(root, document.uri.fsPath).replaceAll('\\', '/');
      const { messages } = compiler.extractFile(fileId, text, {
        processors: config.processors,
      });
      for (const message of messages) {
        for (const location of message.locations) {
          const base = location.range.start.offset + 1;
          if (
            text.slice(base, base + message.source.length) !== message.source
          ) {
            continue;
          }
          collectTokens(message.source, base);
        }
      }
    }
    for (const [kind, decorationType] of decorationTypes) {
      editor.setDecorations(decorationType, rangesByKind.get(kind) ?? []);
    }
  };

  return {
    dispose() {
      for (const decorationType of decorationTypes.values()) {
        decorationType.dispose();
      }
      decorationTypes.clear();
    },
    render(editor) {
      if (editor === undefined) {
        return;
      }
      void applyDecorations(editor).catch(() => {
        resetDecorations(editor);
      });
    },
  };
}

const TOKEN_COLORS: Record<DecoratedTokenKind, string> = {
  branch: 'charts.yellow',
  keyword: 'charts.purple',
  placeholder: 'editorInlayHint.foreground',
  pound: 'charts.green',
  punctuation: 'editorLineNumber.foreground',
  slot: 'editorInlayHint.background',
  tag: 'charts.blue',
};

function buildRenderOptions(kind: DecoratedTokenKind) {
  const themeColor = new ThemeColor(TOKEN_COLORS[kind]);
  if (kind === 'slot') {
    return {
      backgroundColor: themeColor,
      borderRadius: '3px',
    };
  }
  if (kind === 'placeholder') {
    return {
      color: themeColor,
      fontStyle: 'italic',
    };
  }
  return {
    color: themeColor,
  };
}
