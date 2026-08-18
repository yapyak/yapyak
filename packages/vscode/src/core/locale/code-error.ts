import type { CompilerModule } from '../project';

export function toLocaleCodeError(
  compiler: Pick<CompilerModule, 'validateLocaleCode'>,
  value: string,
): string | undefined {
  const code = value.trim();
  if (code === '') {
    return undefined;
  }
  const result = compiler.validateLocaleCode(code);
  if (result.valid) {
    return undefined;
  }
  return result.suggestion === undefined
    ? `"${code}" is not a valid locale code.`
    : `"${code}" is not a valid locale code. Did you mean ${result.suggestion}?`;
}
