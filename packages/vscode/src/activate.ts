import type { DocumentSelector, ExtensionContext, Uri } from 'vscode';

import { CodeActionKind, commands, languages, window, workspace } from 'vscode';

import {
  createAddLocaleCommand,
  createOpenLocaleCommand,
  createOpenSourceCommand,
  createOpenTranslationCommand,
  createRetranslateCommand,
  createRetranslateLocaleCommand,
  createShowStatsCommand,
  createTranslateCommand,
} from './command';
import {
  SOURCE_LANGUAGES,
  findProjectRoot,
  invalidateProjectMessages,
} from './core';
import {
  createFilePathDecorator,
  createIcuDecorator,
  createUntranslatedDecorator,
} from './decorator';
import { createDiagnosticPublisher } from './diagnostic';
import {
  createLocaleCodeActionProvider,
  createLocaleCodeLensProvider,
  createLocaleCompletionProvider,
  createLocaleDefinitionProvider,
  createLocaleHoverProvider,
  createSourceCompletionProvider,
  createSourceHoverProvider,
} from './provider';
import { createUntranslatedStatus } from './status';
import { dirname } from 'node:path';

const SOURCE_SELECTOR: DocumentSelector = SOURCE_LANGUAGES.map((language) => ({
  language,
  scheme: 'file',
}));

const LOCALE_SELECTOR: DocumentSelector = {
  language: 'json',
  scheme: 'file',
};

const SOURCE_FILE_GLOB =
  '**/*.{astro,cjs,cts,js,jsx,mjs,mts,svelte,ts,tsx,vue}';
const DEBOUNCE_MILLISECONDS = 150;

export function activate(context: ExtensionContext): void {
  const icuDecorator = createIcuDecorator();
  const filePathDecorator = createFilePathDecorator();
  const untranslatedDecorator = createUntranslatedDecorator();
  const status = createUntranslatedStatus();
  const publisher = createDiagnosticPublisher();
  const localeWatcher = workspace.createFileSystemWatcher('**/*.json');
  const sourceWatcher = workspace.createFileSystemWatcher(SOURCE_FILE_GLOB);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const refreshMessages = (uri: Uri): void => {
    const root = findProjectRoot(dirname(uri.fsPath));
    if (root === undefined) {
      return;
    }
    invalidateProjectMessages(root);
    status.render();
    for (const document of workspace.textDocuments) {
      publisher.emit(document);
    }
  };

  icuDecorator.render(window.activeTextEditor);
  filePathDecorator.render(window.activeTextEditor);
  untranslatedDecorator.render(window.activeTextEditor);
  status.render();
  for (const document of workspace.textDocuments) {
    publisher.emit(document);
  }

  context.subscriptions.push(
    localeWatcher,
    localeWatcher.onDidChange(() => status.render()),
    localeWatcher.onDidCreate(() => status.render()),
    localeWatcher.onDidDelete(() => status.render()),
    sourceWatcher,
    sourceWatcher.onDidChange(refreshMessages),
    sourceWatcher.onDidCreate(refreshMessages),
    sourceWatcher.onDidDelete(refreshMessages),
    languages.registerHoverProvider(
      SOURCE_SELECTOR,
      createSourceHoverProvider(),
    ),
    languages.registerHoverProvider(
      LOCALE_SELECTOR,
      createLocaleHoverProvider(),
    ),
    languages.registerDefinitionProvider(
      LOCALE_SELECTOR,
      createLocaleDefinitionProvider(),
    ),
    languages.registerCodeLensProvider(
      LOCALE_SELECTOR,
      createLocaleCodeLensProvider(),
    ),
    languages.registerCompletionItemProvider(
      LOCALE_SELECTOR,
      createLocaleCompletionProvider(),
      '{',
    ),
    languages.registerCompletionItemProvider(
      SOURCE_SELECTOR,
      createSourceCompletionProvider(),
      '{',
      ',',
      ' ',
    ),
    languages.registerCodeActionsProvider(
      LOCALE_SELECTOR,
      createLocaleCodeActionProvider(),
      {
        providedCodeActionKinds: [
          CodeActionKind.QuickFix,
          CodeActionKind.SourceFixAll.append('yapyak'),
        ],
      },
    ),
    commands.registerCommand('yapyak.retranslate', createRetranslateCommand()),
    commands.registerCommand('yapyak.translate', createTranslateCommand()),
    commands.registerCommand(
      'yapyak.retranslateLocale',
      createRetranslateLocaleCommand(),
    ),
    commands.registerCommand(
      'yapyak.openTranslation',
      createOpenTranslationCommand(),
    ),
    commands.registerCommand('yapyak.openSource', createOpenSourceCommand()),
    commands.registerCommand('yapyak.openLocale', createOpenLocaleCommand()),
    commands.registerCommand('yapyak.showStats', createShowStatsCommand()),
    commands.registerCommand('yapyak.addLocale', createAddLocaleCommand()),
    window.onDidChangeActiveTextEditor((editor) => {
      icuDecorator.render(editor);
      filePathDecorator.render(editor);
      untranslatedDecorator.render(editor);
      status.render();
    }),
    workspace.onDidOpenTextDocument((document) => {
      publisher.emit(document);
    }),
    workspace.onDidChangeTextDocument((event) => {
      if (event.document !== window.activeTextEditor?.document) {
        return;
      }
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        icuDecorator.render(window.activeTextEditor);
        filePathDecorator.render(window.activeTextEditor);
        untranslatedDecorator.render(window.activeTextEditor);
        publisher.emit(event.document);
      }, DEBOUNCE_MILLISECONDS);
    }),
    workspace.onDidSaveTextDocument((document) => {
      if (!SOURCE_LANGUAGES.includes(document.languageId)) {
        publisher.emit(document);
      }
    }),
    workspace.onDidCloseTextDocument((document) => {
      publisher.reset(document.uri);
    }),
    {
      dispose() {
        if (timer !== undefined) {
          clearTimeout(timer);
        }
        icuDecorator.dispose();
        filePathDecorator.dispose();
        untranslatedDecorator.dispose();
        status.dispose();
        publisher.dispose();
      },
    },
  );
}

export function deactivate(): void {}
