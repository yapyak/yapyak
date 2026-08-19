import type { Project } from './project';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { collectDocumentDiagnostics } from './document-diagnostic';
import { invalidateProjectMessages, resolveProject } from './project';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SOURCE =
  "import { t } from 'yapyak';\nexport const a = t('Hi {name}');\n";

const TARGET_LOCALE = JSON.stringify(
  {
    'src/a.ts': {
      'Hi {name}': 'Hej {namn}',
      Save: 'Spara',
    },
  },
  null,
  2,
);

const LOAD_TIMEOUT_MILLISECONDS = 30_000;

let project: Project;
let root: string;

beforeEach(async () => {
  root = mkdtempSync(join(tmpdir(), 'yapyak-vscode-diagnostic-'));
  mkdirSync(join(root, 'src'));
  mkdirSync(join(root, 'locales'));
  writeFileSync(join(root, 'yapyak.config.mjs'), 'export default {};\n');
  writeFileSync(join(root, 'src', 'a.ts'), SOURCE);
  writeFileSync(join(root, 'locales', 'en.json'), '{}\n');
  writeFileSync(join(root, 'locales', 'sv.json'), TARGET_LOCALE);
  const resolved = await resolveProject(root);
  if (resolved === undefined) {
    throw new Error('yapyak is not installed next to the extension.');
  }
  project = resolved;
}, LOAD_TIMEOUT_MILLISECONDS);

afterEach(() => {
  invalidateProjectMessages(root);
  rmSync(root, {
    force: true,
    recursive: true,
  });
});

describe('collectDocumentDiagnostics', () => {
  it('collects the compiler diagnostics of a source file', () => {
    const diagnostics = collectDocumentDiagnostics(project, {
      content: SOURCE,
      fileId: 'src/a.ts',
      languageId: 'typescript',
      path: join(root, 'src', 'a.ts'),
    });

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      project.compiler.YAP_COMPILE.PARSER_MISSING_PARAM.code,
    ]);
  });

  it('collects the shape diagnostics of the default locale file', () => {
    const diagnostics = collectDocumentDiagnostics(project, {
      content: '{}\n',
      fileId: 'locales/en.json',
      languageId: 'json',
      path: join(root, 'locales', 'en.json'),
    });

    expect(diagnostics).toEqual([]);
  });

  it('collects the ICU and usage diagnostics of a target locale file', () => {
    const diagnostics = collectDocumentDiagnostics(project, {
      content: TARGET_LOCALE,
      fileId: 'locales/sv.json',
      languageId: 'json',
      path: join(root, 'locales', 'sv.json'),
    });

    expect(diagnostics.map((diagnostic) => diagnostic.code).sort()).toEqual([
      project.compiler.YAP_COMPILE.PLACEHOLDER_MISSPELLED_IN_TARGET.code,
      project.compiler.YAP_COMPILE.CATALOG_ENTRY_UNUSED.code,
    ]);
  });

  it('collects no diagnostics for a file yapyak does not read', () => {
    expect(
      collectDocumentDiagnostics(project, {
        content: '# yapyak\n',
        fileId: 'README.md',
        languageId: 'markdown',
        path: join(root, 'README.md'),
      }),
    ).toEqual([]);
  });
});
