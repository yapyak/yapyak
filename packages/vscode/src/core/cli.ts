import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type CliResult = {
  code: number;
  stderr: string;
  stdout: string;
};

const DETAIL_LINES = 2;

export function toCliErrorDetail(result: CliResult): string {
  const output = result.stderr.trim() === '' ? result.stdout : result.stderr;
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .slice(-DETAIL_LINES)
    .join(' ');
}

export function resolveCliPath(root: string): string | undefined {
  let current = root;
  let previous = '';
  while (current !== previous) {
    const candidate = join(
      current,
      'node_modules',
      'yapyak',
      'dist',
      'cli',
      'bin.js',
    );
    if (existsSync(candidate)) {
      return candidate;
    }
    previous = current;
    current = dirname(current);
  }
  return undefined;
}

export function runCli(
  cliPath: string,
  root: string,
  commandArguments: string[],
  onOutput: (line: string) => void,
): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        cliPath,
        ...commandArguments,
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
          NO_COLOR: '1',
        },
      },
    );
    let stderr = '';
    let stdout = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      const lines = text
        .split('\n')
        .map((candidate) => candidate.trim())
        .filter((candidate) => candidate !== '');
      const line = lines[lines.length - 1];
      if (line !== undefined) {
        onOutput(line);
      }
    });
    child.on('close', (code) => {
      resolve({
        code: code ?? 1,
        stderr,
        stdout,
      });
    });
    child.on('error', (error) => {
      resolve({
        code: 1,
        stderr: String(error),
        stdout,
      });
    });
  });
}
