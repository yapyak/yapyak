import type { Diagnostic } from 'yapyak/compiler/internal';
import type { CompilerModule } from './project';

export type DiagnosticItem = {
  code: string;
  docsUrl: string;
  endOffset: number;
  message: string;
  severity: 'error' | 'warning';
  startOffset: number;
};

export function toDiagnosticCode(code: unknown): string | undefined {
  return typeof code === 'object' &&
    code !== null &&
    'value' in code &&
    typeof code.value === 'string'
    ? code.value
    : undefined;
}

export function toDiagnosticItem(
  compiler: Pick<CompilerModule, 'getDocsUrl'>,
  diagnostic: Diagnostic,
): DiagnosticItem {
  const message =
    diagnostic.hint === undefined
      ? diagnostic.message
      : `${diagnostic.message}\n${diagnostic.hint}`;
  return {
    code: diagnostic.code,
    docsUrl: compiler.getDocsUrl(diagnostic.code),
    endOffset: diagnostic.range.end.offset,
    message,
    severity: diagnostic.severity,
    startOffset: diagnostic.range.start.offset,
  };
}
