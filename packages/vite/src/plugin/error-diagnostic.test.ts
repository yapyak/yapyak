import type { Logger } from 'vite';
import type { ExtractFileResult } from 'yapyak/compiler';

import { describe, expect, it, vi } from 'vitest';

import { renderErrorDiagnostics } from './error-diagnostic';

function buildLogger(): Logger {
  return {
    clearScreen: vi.fn(),
    error: vi.fn(),
    hasErrorLogged: () => false,
    hasWarned: false,
    info: vi.fn(),
    warn: vi.fn(),
    warnOnce: vi.fn(),
  };
}

function buildResult(
  diagnostics: ExtractFileResult['diagnostics'],
): ExtractFileResult {
  return {
    callSites: [],
    diagnostics,
    messages: [],
  };
}

describe('renderErrorDiagnostics', () => {
  it('writes a logger error for every error diagnostic', () => {
    const logger = buildLogger();
    renderErrorDiagnostics(
      logger,
      buildResult([
        {
          code: 'YPK101',
          fileId: 'src/a.tsx',
          message: 'Bad source',
          range: {
            end: {
              column: 10,
              line: 3,
              offset: 30,
            },
            start: {
              column: 5,
              line: 3,
              offset: 25,
            },
          },
          severity: 'error',
          source: 'Hello',
        },
      ]),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('YPK101'),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('src/a.tsx:3:5'),
    );
  });

  it('writes no logger error for a warning diagnostic', () => {
    const logger = buildLogger();
    renderErrorDiagnostics(
      logger,
      buildResult([
        {
          code: 'YPK201',
          fileId: 'src/a.tsx',
          message: 'Soft hint',
          range: {
            end: {
              column: 2,
              line: 1,
              offset: 2,
            },
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
          },
          severity: 'warning',
          source: 'Hello',
        },
      ]),
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('writes no logger error when the result has no diagnostics', () => {
    const logger = buildLogger();
    renderErrorDiagnostics(logger, buildResult([]));
    expect(logger.error).not.toHaveBeenCalled();
  });
});
