import type { CompilerModule } from '../project';

import { isWhitespace, skipWhitespace } from '../whitespace';

export type LocaleFix = {
  title: string;
  unambiguous: boolean;
  value: string;
};

export type ResolveLocaleFixInput = {
  code: string;
  source: string;
  value: string;
};

type FixCompiler = Pick<CompilerModule, 'YAP_COMPILE' | 'parsePlaceholders'>;

export function resolveLocaleFix(
  compiler: FixCompiler,
  input: ResolveLocaleFixInput,
): LocaleFix | undefined {
  const sourceNames = toNames(compiler, input.source);
  const targetNames = toNames(compiler, input.value);
  const missing = sourceNames.filter((name) => !targetNames.includes(name));
  if (input.code === compiler.YAP_COMPILE.PLACEHOLDER_MISSING_IN_TARGET.code) {
    const name = missing[0];
    if (name === undefined || missing.length > 1) {
      return undefined;
    }
    return {
      title: `Add {${name}} to the translation`,
      unambiguous: false,
      value: `${input.value} {${name}}`,
    };
  }
  if (
    input.code === compiler.YAP_COMPILE.PLACEHOLDER_MISSPELLED_IN_TARGET.code
  ) {
    const extra = targetNames.filter((name) => !sourceNames.includes(name));
    const from = extra[0];
    const to = missing[0];
    if (from === undefined || to === undefined) {
      return undefined;
    }
    if (extra.length > 1 || missing.length > 1) {
      return undefined;
    }
    return {
      title: `Rename {${from}} to {${to}}`,
      unambiguous: true,
      value: renamePlaceholder(input.value, from, to),
    };
  }
  return undefined;
}

function toNames(compiler: FixCompiler, text: string): string[] {
  return compiler
    .parsePlaceholders(text)
    .placeholders.map((placeholder) => placeholder.name);
}

function renamePlaceholder(value: string, from: string, to: string): string {
  let result = '';
  let index = 0;
  while (index < value.length) {
    if (value[index] !== '{') {
      result += value[index];
      index += 1;
      continue;
    }
    const nameStart = skipWhitespace(value, index + 1);
    const nameEnd = nameStart + from.length;
    const boundary = value[nameEnd];
    if (
      value.slice(nameStart, nameEnd) !== from ||
      (boundary !== '}' && boundary !== ',' && !isWhitespace(boundary))
    ) {
      result += value[index];
      index += 1;
      continue;
    }
    result += `${value.slice(index, nameStart)}${to}`;
    index = nameEnd;
  }
  return result;
}
