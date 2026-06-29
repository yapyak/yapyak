import type { Token } from './type';

import { mergePlainTokens } from './plain-token';

export function tokenizeYaml(code: string): Token[] {
  const tokens: Token[] = [];
  const lines = code.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex] ?? '';
    const trailing = lineIndex < lines.length - 1 ? '\n' : '';
    let cursor = 0;

    const indent = /^[ \t]*/.exec(line)?.[0] ?? '';
    if (indent) {
      tokens.push({
        kind: 'plain',
        value: indent,
      });
      cursor += indent.length;
    }

    if (cursor >= line.length) {
      if (trailing) {
        tokens.push({
          kind: 'plain',
          value: trailing,
        });
      }
      continue;
    }

    if (line[cursor] === '#') {
      tokens.push({
        kind: 'comment',
        value: line.slice(cursor) + trailing,
      });
      continue;
    }

    if (
      line[cursor] === '-' &&
      (line[cursor + 1] === ' ' || cursor + 1 === line.length)
    ) {
      tokens.push({
        kind: 'punct',
        value: '-',
      });
      cursor++;
    }

    while (cursor < line.length && line[cursor] === ' ') {
      tokens.push({
        kind: 'plain',
        value: ' ',
      });
      cursor++;
    }

    if (cursor >= line.length) {
      if (trailing) {
        tokens.push({
          kind: 'plain',
          value: trailing,
        });
      }
      continue;
    }

    const keyMatch = /^([A-Za-z_][\w-]*)(\s*:)(\s|$)/.exec(line.slice(cursor));
    if (keyMatch) {
      tokens.push({
        kind: 'keyword',
        value: keyMatch[1] ?? '',
      });
      tokens.push({
        kind: 'punct',
        value: keyMatch[2] ?? '',
      });
      cursor += (keyMatch[1]?.length ?? 0) + (keyMatch[2]?.length ?? 0);
    }

    while (cursor < line.length) {
      const remainder = line.slice(cursor);

      const ws = /^[ \t]+/.exec(remainder);
      if (ws) {
        tokens.push({
          kind: 'plain',
          value: ws[0],
        });
        cursor += ws[0].length;
        continue;
      }

      if (remainder[0] === '#') {
        tokens.push({
          kind: 'comment',
          value: line.slice(cursor),
        });
        cursor = line.length;
        continue;
      }

      if (remainder[0] === '"' || remainder[0] === "'") {
        const quote = remainder[0];
        const regex =
          quote === "'" ? /^'(?:\\.|[^'\\])*'/ : /^"(?:\\.|[^"\\])*"/;
        const match = regex.exec(remainder);
        if (match) {
          tokens.push({
            kind: 'string',
            value: match[0],
          });
          cursor += match[0].length;
          continue;
        }
      }

      const numberMatch = /^-?\d+(?:\.\d+)?(?=\s|$|,)/.exec(remainder);
      if (numberMatch) {
        tokens.push({
          kind: 'number',
          value: numberMatch[0],
        });
        cursor += numberMatch[0].length;
        continue;
      }

      const literalMatch = /^(true|false|null|~)(?=\s|$|,)/.exec(remainder);
      if (literalMatch) {
        tokens.push({
          kind: 'literal',
          value: literalMatch[0],
        });
        cursor += literalMatch[0].length;
        continue;
      }

      tokens.push({
        kind: 'plain',
        value: remainder,
      });
      cursor = line.length;
    }

    if (trailing) {
      tokens.push({
        kind: 'plain',
        value: trailing,
      });
    }
  }

  return mergePlainTokens(tokens);
}
