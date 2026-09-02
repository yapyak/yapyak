import type { ContextLevel, Translator } from 'yapyak/translator';

import {
  TranslatorAuthError,
  TranslatorError,
  TranslatorInvalidResponseError,
  TranslatorRateLimitError,
  TranslatorTimeoutError,
  createTranslator,
} from 'yapyak/translator';
import {
  buildSystem,
  parseTranslationsBatch,
} from 'yapyak/translator/internal';

import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';

/** Options for {@link claudeCode}. */
export type ClaudeCodeOptions = {
  /**
   * The maximum items per CLI run.
   *
   * @defaultValue `25`
   */
  batchSize?: number;
  /**
   * The maximum parallel CLI runs.
   *
   * @defaultValue `2`
   */
  concurrency?: number;
  /**
   * The call-site context level.
   *
   * @defaultValue `'minimal'`
   */
  context?: ContextLevel;
  /**
   * The maximum style-reference examples per request.
   *
   * @defaultValue `5`, or `0` when `context` is `'none'`
   */
  examples?: number;
  /** The translation glossary. */
  glossary?: Record<string, Record<string, string>>;
  /** The model name. If `undefined`, the CLI's configured model is used. */
  model?: string;
  /**
   * The per-run timeout in milliseconds.
   *
   * @defaultValue `120_000`
   */
  timeout?: number;
  /** The voice and tone guidance. */
  voice?: string;
};

const VENDOR = 'claude-code';
const DEFAULT_CONCURRENCY = 2;
const DEFAULT_TIMEOUT = 120_000;
const STDERR_PREVIEW_LENGTH = 200;
const AUTH_RX = /log ?in|authenticat|api key/i;
const RATE_LIMIT_RX = /usage limit|rate limit|overloaded/i;

/**
 * Creates a Claude Code translator.
 *
 * @remarks
 * Runs the `claude` CLI in print mode, so translation uses the developer's Claude subscription and needs no API key. Requires the `claude` command on `PATH`, signed in.
 *
 * @param options - The options.
 *
 * @example
 * ```ts [yapyak.config.ts]
 * import { claudeCode } from '@yapyak/claude-code';
 * import { defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   translator: claudeCode()
 * });
 * ```
 */
export function claudeCode(options: ClaudeCodeOptions = {}): Translator {
  const {
    batchSize,
    concurrency = DEFAULT_CONCURRENCY,
    context,
    examples,
    glossary,
    model,
    timeout = DEFAULT_TIMEOUT,
    voice,
  } = options;

  return createTranslator({
    batchSize,
    concurrency,
    context,
    examples,
    id: VENDOR,
    translate: async ({ items, signal, sourceLocale, targetLocales }) => {
      const prompt = [
        buildSystem(sourceLocale, targetLocales, {
          glossary,
          voice,
        }),
        JSON.stringify(items),
      ].join('\n\n');
      const runOptions: RunClaudeOptions = {
        timeout,
      };
      if (model !== undefined) {
        runOptions.model = model;
      }
      if (signal) {
        runOptions.signal = signal;
      }
      const stdout = await runClaude(prompt, runOptions);
      return parseTranslationsBatch(readResult(stdout), VENDOR);
    },
  });
}

type RunClaudeOptions = {
  model?: string;
  signal?: AbortSignal;
  timeout: number;
};

function runClaude(prompt: string, options: RunClaudeOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', buildCliArgs(options.model), {
      cwd: tmpdir(),
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(
        new TranslatorTimeoutError(
          `yapyak claude-code: \`claude\` did not respond within ${options.timeout}ms. Raise \`timeout\` in the translator options or lower \`batchSize\`.`,
          {
            vendor: VENDOR,
          },
        ),
      );
    }, options.timeout);
    const abort = (): void => {
      child.kill('SIGTERM');
    };
    options.signal?.addEventListener('abort', abort, {
      once: true,
    });
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk;
    });
    child.on('error', (cause: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      reject(toSpawnError(cause));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
      if (options.signal?.aborted) {
        reject(options.signal.reason);
        return;
      }
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(toExitError(code, stderr, stdout));
    });
    child.stdin.end(prompt);
  });
}

function buildCliArgs(model: string | undefined): string[] {
  const cliArgs = [
    '-p',
    '--output-format',
    'json',
    '--max-turns',
    '1',
  ];
  if (model !== undefined) {
    cliArgs.push('--model', model);
  }
  return cliArgs;
}

function toSpawnError(cause: NodeJS.ErrnoException): Error {
  if (cause.code === 'ENOENT') {
    return new Error(
      '@yapyak/claude-code: `claude` was not found on PATH. Install Claude Code and sign in first.',
    );
  }
  return new TranslatorError(
    `yapyak claude-code: failed to start \`claude\`: ${cause.message}.`,
    {
      cause,
      vendor: VENDOR,
    },
  );
}

function toExitError(
  code: number | null,
  stderr: string,
  stdout: string,
): TranslatorError | Error {
  const body = tryParseBody(stdout);
  if (body?.is_error === true) {
    return toReportedError(body);
  }
  const preview = stderr.trim().slice(0, STDERR_PREVIEW_LENGTH);
  if (AUTH_RX.test(stderr)) {
    return new TranslatorAuthError(
      'yapyak claude-code: `claude` is not signed in. Run `claude` and sign in, or configure an API translator instead.',
      {
        vendor: VENDOR,
      },
    );
  }
  if (RATE_LIMIT_RX.test(stderr)) {
    return new TranslatorRateLimitError(
      `yapyak claude-code: the Claude subscription usage limit is reached. ${preview}`,
      {
        vendor: VENDOR,
      },
    );
  }
  return new TranslatorError(
    `yapyak claude-code: \`claude\` exited with code ${code}. ${preview}`,
    {
      vendor: VENDOR,
    },
  );
}

type ClaudeCodeResponseBody = {
  // biome-ignore lint/style/useNamingConvention: yap yap yap
  api_error_status?: number;
  // biome-ignore lint/style/useNamingConvention: yap yap yap
  is_error?: boolean;
  result?: string;
  subtype?: string;
};

function tryParseBody(stdout: string): ClaudeCodeResponseBody | undefined {
  try {
    const parsed: unknown = JSON.parse(stdout);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as ClaudeCodeResponseBody;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function toReportedError(body: ClaudeCodeResponseBody): TranslatorError {
  const message = body.result ?? '';
  const preview = message.trim().slice(0, STDERR_PREVIEW_LENGTH);
  if (body.api_error_status === 401 || AUTH_RX.test(message)) {
    return new TranslatorAuthError(
      `yapyak claude-code: \`claude\` failed to authenticate. Run \`claude\` and sign in, or configure an API translator instead. ${preview}`,
      {
        vendor: VENDOR,
      },
    );
  }
  if (body.api_error_status === 429 || RATE_LIMIT_RX.test(message)) {
    return new TranslatorRateLimitError(
      `yapyak claude-code: the Claude subscription usage limit is reached. ${preview}`,
      {
        vendor: VENDOR,
      },
    );
  }
  return new TranslatorError(
    `yapyak claude-code: \`claude\` reported an error${body.subtype === undefined ? '' : ` (${body.subtype})`}. ${preview}`,
    {
      vendor: VENDOR,
    },
  );
}

function readResult(stdout: string): string {
  let body: ClaudeCodeResponseBody;
  try {
    body = JSON.parse(stdout) as ClaudeCodeResponseBody;
  } catch (cause) {
    throw new TranslatorInvalidResponseError(
      `yapyak claude-code: CLI output is not valid JSON. Preview: ${JSON.stringify(stdout.trim().slice(0, STDERR_PREVIEW_LENGTH))}`,
      {
        cause,
        vendor: VENDOR,
      },
    );
  }
  if (body.is_error === true) {
    throw toReportedError(body);
  }
  if (typeof body.result !== 'string') {
    throw new TranslatorInvalidResponseError(
      'yapyak claude-code: CLI output did not contain a result string.',
      {
        vendor: VENDOR,
      },
    );
  }
  return body.result;
}
