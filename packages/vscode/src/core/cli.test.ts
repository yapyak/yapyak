import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveCliPath, runCli, toCliErrorDetail } from './cli';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('resolveCliPath', () => {
  it('returns the cli path when found', () => {
    expect(resolveCliPath(dirname(fileURLToPath(import.meta.url)))).toMatch(
      /yapyak\/dist\/cli\/bin\.js$/,
    );
  });

  it('returns undefined when not found', () => {
    expect(resolveCliPath(tmpdir())).toBeUndefined();
  });
});

describe('runCli', () => {
  let root: string;
  let script: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-vscode-cli-'));
    script = join(root, 'cli.mjs');
  });

  afterEach(() => {
    rmSync(root, {
      force: true,
      recursive: true,
    });
  });

  it('returns the exit code, stdout and stderr of the process', async () => {
    writeFileSync(
      script,
      "process.stdout.write('Hello\\n');\nprocess.stderr.write('Cancel\\n');\nprocess.exit(3);\n",
    );
    const result = await runCli(script, root, [], () => undefined);

    expect(result).toEqual({
      code: 3,
      stderr: 'Cancel\n',
      stdout: 'Hello\n',
    });
  });

  it('forwards the last line of every stdout chunk', async () => {
    writeFileSync(
      script,
      "process.stdout.write('Loading...\\n\\nSave changes\\n');\n",
    );
    const lines: string[] = [];
    await runCli(script, root, [], (line) => lines.push(line));

    expect(lines).toEqual([
      'Save changes',
    ]);
  });

  it('forwards the command arguments and disables colour', async () => {
    writeFileSync(
      script,
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      "process.stdout.write(`${process.argv.slice(2).join(' ')} ${process.env.NO_COLOR}`);\n",
    );
    const result = await runCli(
      script,
      root,
      [
        'translate',
        'sv',
      ],
      () => undefined,
    );

    expect(result.stdout).toBe('translate sv 1');
  });
});

describe('toCliErrorDetail', () => {
  it('builds the detail from the last two lines of stderr', () => {
    expect(
      toCliErrorDetail({
        code: 1,
        stderr:
          '\n  ✗ Invalid locale code.\n\n    xx is not a recognized code.\n\n',
        stdout: 'Adding locales: xx\n',
      }),
    ).toBe('✗ Invalid locale code. xx is not a recognized code.');
  });

  it('builds the detail from stdout when stderr is empty', () => {
    expect(
      toCliErrorDetail({
        code: 1,
        stderr: '',
        stdout: '  Translating 3 strings…\n  ✗ 0 translated · 3 failed\n',
      }),
    ).toBe('Translating 3 strings… ✗ 0 translated · 3 failed');
  });

  it('builds an empty detail when nothing was written', () => {
    expect(
      toCliErrorDetail({
        code: 1,
        stderr: '',
        stdout: '',
      }),
    ).toBe('');
  });
});
