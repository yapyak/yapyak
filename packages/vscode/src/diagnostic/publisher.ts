import type { TextDocument, Uri } from 'vscode';
import type { Diagnostic } from 'yapyak/compiler/internal';
import type { CompilerModule } from '../core';

import {
  DiagnosticSeverity,
  DiagnosticTag,
  Range,
  Diagnostic as VscodeDiagnostic,
  Uri as VscodeUri,
  languages,
} from 'vscode';

import {
  collectDocumentDiagnostics,
  resolveProject,
  toDiagnosticItem,
} from '../core';
import { dirname, relative } from 'node:path';

export type DiagnosticPublisher = {
  reset: (uri: Uri) => void;
  dispose: () => void;
  emit: (document: TextDocument) => void;
};

export function createDiagnosticPublisher(): DiagnosticPublisher {
  const collection = languages.createDiagnosticCollection('yapyak');

  const run = async (document: TextDocument): Promise<void> => {
    const path = document.uri.fsPath;
    const project = await resolveProject(dirname(path));
    if (project === undefined) {
      collection.delete(document.uri);
      return;
    }
    collection.set(
      document.uri,
      collectDocumentDiagnostics(project, {
        content: document.getText(),
        fileId: relative(project.root, path).replaceAll('\\', '/'),
        languageId: document.languageId,
        path,
      }).map((diagnostic) =>
        toVscodeDiagnostic(project.compiler, document, diagnostic),
      ),
    );
  };

  return {
    dispose() {
      collection.dispose();
    },
    emit(document) {
      void run(document);
    },
    reset(uri) {
      collection.delete(uri);
    },
  };
}

function toVscodeDiagnostic(
  compiler: Pick<CompilerModule, 'YAP_COMPILE' | 'getDocsUrl'>,
  document: TextDocument,
  diagnostic: Diagnostic,
): VscodeDiagnostic {
  const item = toDiagnosticItem(compiler, diagnostic);
  const isUnused = item.code === compiler.YAP_COMPILE.CATALOG_ENTRY_UNUSED.code;
  const start = document.positionAt(item.startOffset);
  const line = document.lineAt(start.line);
  const end =
    item.endOffset > item.startOffset && !isUnused
      ? document.positionAt(item.endOffset)
      : line.range.end;
  const result = new VscodeDiagnostic(
    new Range(
      isUnused
        ? line.range.start.translate(0, line.firstNonWhitespaceCharacterIndex)
        : start,
      end,
    ),
    item.message,
    item.severity === 'error'
      ? DiagnosticSeverity.Error
      : DiagnosticSeverity.Warning,
  );
  result.code = {
    target: VscodeUri.parse(item.docsUrl),
    value: item.code,
  };
  result.source = 'yapyak';
  if (isUnused) {
    result.tags = [
      DiagnosticTag.Unnecessary,
    ];
  }
  return result;
}
