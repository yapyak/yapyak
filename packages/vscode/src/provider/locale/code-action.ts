import type { CodeActionProvider, Diagnostic, TextDocument } from 'vscode';
import type { FindEntryAtInput, LocaleEntry, LocaleFix } from '../../core';

import {
  CodeAction,
  CodeActionKind,
  Range,
  WorkspaceEdit,
  languages,
} from 'vscode';

import {
  collectLocaleEntries,
  findEntryAt,
  isLocaleFile,
  resolveDeletionRange,
  resolveLocaleFix,
  resolveProject,
  toDiagnosticCode,
} from '../../core';
import { dirname } from 'node:path';

const FIX_ALL_KIND = CodeActionKind.SourceFixAll.append('yapyak');

export function createLocaleCodeActionProvider(): CodeActionProvider {
  return {
    async provideCodeActions(document, _range, context) {
      const path = document.uri.fsPath;
      const project = await resolveProject(dirname(path));
      if (
        project === undefined ||
        !isLocaleFile(project.root, project.config.localesDir, path)
      ) {
        return [];
      }
      const { compiler } = project;
      const entries = collectLocaleEntries(document.getText());
      const actions: CodeAction[] = [];
      for (const diagnostic of context.diagnostics) {
        if (diagnostic.source !== 'yapyak') {
          continue;
        }
        const action = buildAction(
          compiler,
          toActionInput(document, entries, diagnostic),
        );
        if (action !== undefined) {
          action.diagnostics = [
            diagnostic,
          ];
          actions.push(action);
        }
      }
      const fixAll = buildFixAllAction(compiler, document, entries);
      if (fixAll !== undefined) {
        actions.push(fixAll);
      }
      return actions;
    },
  };
}

function buildFixAllAction(
  compiler: Parameters<typeof resolveLocaleFix>[0],
  document: TextDocument,
  entries: LocaleEntry[],
): CodeAction | undefined {
  const edit = new WorkspaceEdit();
  let count = 0;
  for (const diagnostic of languages.getDiagnostics(document.uri)) {
    if (diagnostic.source !== 'yapyak') {
      continue;
    }
    const fix = resolveFix(
      compiler,
      toActionInput(document, entries, diagnostic),
    );
    if (fix === undefined || !fix.fix.unambiguous) {
      continue;
    }
    edit.replace(document.uri, fix.range, fix.fix.value);
    count += 1;
  }
  if (count === 0) {
    return undefined;
  }
  const action = new CodeAction(`Fix all (${count})`, FIX_ALL_KIND);
  action.edit = edit;
  return action;
}

type ActionInput = FindEntryAtInput & {
  document: TextDocument;
  value?: string;
};

function toActionInput(
  document: TextDocument,
  entries: LocaleEntry[],
  diagnostic: Diagnostic,
): ActionInput {
  const line = document.lineAt(diagnostic.range.start.line);
  const code = toDiagnosticCode(diagnostic.code);
  return {
    document,
    entries,
    lineEnd: document.offsetAt(line.range.end),
    lineStart: document.offsetAt(line.range.start),
    offset: document.offsetAt(diagnostic.range.start),
    ...(code === undefined
      ? {}
      : {
          value: code,
        }),
  };
}

type ResolvedFix = {
  fix: LocaleFix;
  range: Range;
};

function resolveFix(
  compiler: Parameters<typeof resolveLocaleFix>[0],
  input: ActionInput,
): ResolvedFix | undefined {
  if (input.value === undefined) {
    return undefined;
  }
  const entry = findEntryAt(input);
  if (entry === undefined) {
    return undefined;
  }
  const range = new Range(
    input.document.positionAt(entry.offset),
    input.document.positionAt(entry.offset + entry.length),
  );
  const fix = resolveLocaleFix(compiler, {
    code: input.value,
    source: entry.source,
    value: input.document.getText(range),
  });
  if (fix === undefined) {
    return undefined;
  }
  return {
    fix,
    range,
  };
}

function buildRemoveAction(
  compiler: Parameters<typeof resolveLocaleFix>[0],
  input: ActionInput,
): CodeAction | undefined {
  if (input.value !== compiler.YAP_COMPILE.CATALOG_ENTRY_UNUSED.code) {
    return undefined;
  }
  const entry = findEntryAt(input);
  if (entry === undefined) {
    return undefined;
  }
  const text = input.document.getText();
  const deletion = resolveDeletionRange(text, entry);
  const action = new CodeAction(
    'Remove unused translation',
    CodeActionKind.QuickFix,
  );
  action.edit = new WorkspaceEdit();
  action.edit.delete(
    input.document.uri,
    new Range(
      input.document.positionAt(deletion.start),
      input.document.positionAt(deletion.end),
    ),
  );
  action.isPreferred = true;
  return action;
}

function buildAction(
  compiler: Parameters<typeof resolveLocaleFix>[0],
  input: ActionInput,
): CodeAction | undefined {
  const remove = buildRemoveAction(compiler, input);
  if (remove !== undefined) {
    return remove;
  }
  const resolved = resolveFix(compiler, input);
  if (resolved === undefined) {
    return undefined;
  }
  const action = new CodeAction(resolved.fix.title, CodeActionKind.QuickFix);
  action.edit = new WorkspaceEdit();
  action.edit.replace(input.document.uri, resolved.range, resolved.fix.value);
  action.isPreferred = true;
  return action;
}
