import type { ChildProcess } from 'node:child_process';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { claudeCode } from './claude-code';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { tmpdir } from 'node:os';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(spawn).mockReset();
});

type StubSpawnInput = {
  errorCode?: string;
  exitCode?: number;
  hang?: boolean;
  stderr?: string;
  stdout?: string;
};

type FakeChild = EventEmitter & {
  kill: ReturnType<typeof vi.fn>;
  stderr: EventEmitter;
  stdin: {
    end: ReturnType<typeof vi.fn>;
  };
  stdout: EventEmitter;
};

function stubSpawn(input: StubSpawnInput = {}): FakeChild {
  const child = new EventEmitter() as FakeChild;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = {
    end: vi.fn(),
  };
  child.kill = vi.fn();
  vi.mocked(spawn).mockReturnValue(child as unknown as ChildProcess);
  if (!input.hang) {
    queueMicrotask(() => {
      if (input.errorCode !== undefined) {
        const cause: NodeJS.ErrnoException = new Error(
          `spawn claude ${input.errorCode}`,
        );
        cause.code = input.errorCode;
        child.emit('error', cause);
        return;
      }
      if (input.stdout !== undefined) {
        child.stdout.emit('data', input.stdout);
      }
      if (input.stderr !== undefined) {
        child.stderr.emit('data', input.stderr);
      }
      child.emit('close', input.exitCode ?? 0);
    });
  }
  return child;
}

function buildResultBody(translations: string): string {
  return JSON.stringify({
    is_error: false,
    result: translations,
    subtype: 'success',
  });
}

function runHello(): Promise<string> {
  return claudeCode()({
    fileId: 'src/a.tsx',
    source: 'Hello',
    sourceLocale: 'en',
    targetLocale: 'sv',
  });
}

describe('claudeCode', () => {
  it('returns translated text from the CLI result', async () => {
    stubSpawn({
      stdout: buildResultBody(
        JSON.stringify([
          {
            sv: 'Hej',
          },
        ]),
      ),
    });
    expect(await runHello()).toBe('Hej');
  });

  it('sends the system prompt and the items on stdin', async () => {
    const child = stubSpawn({
      stdout: buildResultBody(
        JSON.stringify([
          {
            sv: 'Hej',
          },
        ]),
      ),
    });
    await runHello();
    const prompt = child.stdin.end.mock.calls[0]?.[0] as string;
    expect(prompt).toContain('professional translator');
    expect(prompt).toContain('"source":"Hello"');
  });

  it('builds CLI args without a model flag by default', async () => {
    stubSpawn({
      stdout: buildResultBody(
        JSON.stringify([
          {
            sv: 'Hej',
          },
        ]),
      ),
    });
    await runHello();
    expect(vi.mocked(spawn).mock.calls[0]?.[1]).toEqual([
      '-p',
      '--output-format',
      'json',
      '--max-turns',
      '1',
    ]);
  });

  it('builds CLI args with the configured model when set', async () => {
    stubSpawn({
      stdout: buildResultBody(
        JSON.stringify([
          {
            sv: 'Hej',
          },
        ]),
      ),
    });
    await claudeCode({
      model: 'claude-opus-5',
    })({
      fileId: 'src/a.tsx',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(vi.mocked(spawn).mock.calls[0]?.[1]).toContain('claude-opus-5');
  });

  it('isolates the CLI run from the project directory', async () => {
    stubSpawn({
      stdout: buildResultBody(
        JSON.stringify([
          {
            sv: 'Hej',
          },
        ]),
      ),
    });
    await runHello();
    expect(vi.mocked(spawn).mock.calls[0]?.[2]?.cwd).toBe(tmpdir());
  });

  it('throws an auth error when the CLI is signed out', async () => {
    stubSpawn({
      exitCode: 1,
      stderr: 'Invalid API key. Please run /login.',
    });
    await expect(runHello()).rejects.toThrow(/not signed in/);
  });

  it('throws a rate-limit error when the usage limit is reached', async () => {
    stubSpawn({
      exitCode: 1,
      stderr: 'Claude usage limit reached.',
    });
    await expect(runHello()).rejects.toThrow(/usage limit/);
  });

  it('throws a timeout error when the CLI does not respond', async () => {
    vi.useFakeTimers();
    stubSpawn({
      hang: true,
    });
    const pending = runHello();
    const failed = expect(pending).rejects.toThrow(/did not respond/);
    await vi.advanceTimersByTimeAsync(120_000);
    await failed;
  });

  it('throws when `claude` is not installed', async () => {
    stubSpawn({
      errorCode: 'ENOENT',
    });
    await expect(runHello()).rejects.toThrow(/not found on PATH/);
  });

  it('throws when the CLI output is not JSON', async () => {
    stubSpawn({
      stdout: 'not json',
    });
    await expect(runHello()).rejects.toThrow(/not valid JSON/);
  });

  it('throws an auth error when the envelope reports 401 on a failing exit', async () => {
    stubSpawn({
      exitCode: 1,
      stdout: JSON.stringify({
        api_error_status: 401,
        is_error: true,
        result: 'Failed to authenticate. OAuth access token is invalid.',
        subtype: 'success',
      }),
    });
    await expect(runHello()).rejects.toThrow(/failed to authenticate/);
  });

  it('throws a rate-limit error when the envelope reports 429', async () => {
    stubSpawn({
      exitCode: 1,
      stdout: JSON.stringify({
        api_error_status: 429,
        is_error: true,
        result: 'Rate limited.',
        subtype: 'success',
      }),
    });
    await expect(runHello()).rejects.toThrow(/usage limit/);
  });

  it('throws when the result reports an error', async () => {
    stubSpawn({
      stdout: JSON.stringify({
        is_error: true,
        result: 'Something broke.',
        subtype: 'error_during_execution',
      }),
    });
    await expect(runHello()).rejects.toThrow(/reported an error/);
  });
});
