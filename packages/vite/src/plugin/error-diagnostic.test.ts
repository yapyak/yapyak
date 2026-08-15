import type { Logger } from 'vite';
import type { ExtractFileResult } from 'yapyak/compiler/internal';

import { describe, expect, it, vi } from 'vitest';

import {
  formatDiagnostic,
  hasParseFailure,
  renderErrorDiagnostics,
} from './error-diagnostic';

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
  it('writes no logger error for an error diagnostic, leaving the caller to throw it', () => {
    const logger = buildLogger();
    renderErrorDiagnostics(
      logger,
      buildResult([
        {
          code: 'YAP0001',
          fileId: 'src/a.tsx',
          message: 'Hello',
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
        },
      ]),
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('writes no logger error for a warning diagnostic', () => {
    const logger = buildLogger();
    renderErrorDiagnostics(
      logger,
      buildResult([
        {
          code: 'YAP0007',
          fileId: 'src/a.tsx',
          message: 'Hello',
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

  it('writes a logger warn only for the warning in a mixed list, leaving the error to the caller', () => {
    const logger = buildLogger();
    renderErrorDiagnostics(
      logger,
      buildResult([
        {
          code: 'YAP0001',
          fileId: 'src/a.tsx',
          message: 'Hello',
          range: {
            end: {
              column: 5,
              line: 1,
              offset: 5,
            },
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
          },
          severity: 'error',
        },
        {
          code: 'YAP0007',
          fileId: 'src/b.tsx',
          message: 'Hello',
          range: {
            end: {
              column: 5,
              line: 1,
              offset: 5,
            },
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
          },
          severity: 'warning',
        },
      ]),
    );
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('src/b.tsx'),
    );
  });

  it('returns no diagnostic for a processor parse error, leaving it to the framework plugin', () => {
    const logger = buildLogger();
    const errorDiagnostics = renderErrorDiagnostics(
      logger,
      buildResult([
        {
          code: 'YAP0048',
          fileId: 'src/a.svelte',
          message: 'The file does not parse: "Unexpected token".',
          range: {
            end: {
              column: 5,
              line: 1,
              offset: 5,
            },
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
          },
          severity: 'error',
        },
      ]),
    );

    expect(errorDiagnostics).toHaveLength(0);
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('returns the error-severity diagnostics for callers to fail the build on', () => {
    const logger = buildLogger();
    const errorDiagnostics = renderErrorDiagnostics(
      logger,
      buildResult([
        {
          code: 'YAP0001',
          fileId: 'src/a.tsx',
          message: 'Boom',
          range: {
            end: {
              column: 5,
              line: 1,
              offset: 5,
            },
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
          },
          severity: 'error',
        },
        {
          code: 'YAP0007',
          fileId: 'src/b.tsx',
          message: 'Soft',
          range: {
            end: {
              column: 5,
              line: 1,
              offset: 5,
            },
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
          },
          severity: 'warning',
        },
      ]),
    );
    expect(errorDiagnostics).toHaveLength(1);
    expect(errorDiagnostics[0]?.code).toBe('YAP0001');
  });
});

describe('hasParseFailure', () => {
  it('returns true for a processor parse error', () => {
    expect(
      hasParseFailure(
        buildResult([
          {
            code: 'YAP0048',
            fileId: 'src/a.svelte',
            message: 'The file does not parse: "Unexpected token".',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
            severity: 'error',
          },
        ]),
      ),
    ).toBe(true);
  });

  it('returns false for another diagnostic', () => {
    expect(
      hasParseFailure(
        buildResult([
          {
            code: 'YAP0001',
            fileId: 'src/a.tsx',
            message: 'Hello',
            range: {
              end: {
                column: 5,
                line: 1,
                offset: 5,
              },
              start: {
                column: 1,
                line: 1,
                offset: 0,
              },
            },
            severity: 'error',
          },
        ]),
      ),
    ).toBe(false);
  });
});

describe('formatDiagnostic', () => {
  it('renders the diagnostic code, file path, and position', () => {
    const message = formatDiagnostic({
      code: 'YAP0001',
      fileId: 'src/a.tsx',
      message: 'Hello',
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
    });
    expect(message).toContain('YAP0001');
    expect(message).toContain('src/a.tsx:3:5');
  });

  it('renders a docs link for the diagnostic code', () => {
    const message = formatDiagnostic({
      code: 'YAP0001',
      fileId: 'src/a.tsx',
      message: 'Hello',
      range: {
        end: {
          column: 5,
          line: 1,
          offset: 5,
        },
        start: {
          column: 1,
          line: 1,
          offset: 0,
        },
      },
      severity: 'error',
    });
    expect(message).toContain('See ');
  });
});
