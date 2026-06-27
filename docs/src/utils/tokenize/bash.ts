import type { Token } from './type';

import { mergePlainTokens } from './plain-token';

const SUBCOMMAND_TOOLS = new Set([
  'npm',
  'pnpm',
  'yarn',
  'bun',
  'bunx',
  'npx',
  'pnpx',
  'git',
  'yapyak',
  'docker',
  'kubectl',
]);

export function tokenizeBash(code: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let atLineStart = true;
  let expectSubcommand = false;
  let inArgs = false;
  while (index < code.length) {
    const character = code[index] ?? '';

    if (
      character === ' ' ||
      character === '\t' ||
      character === '\n' ||
      character === '\r'
    ) {
      const match = /^[\s]+/.exec(code.slice(index));
      if (match) {
        tokens.push({
          type: 'plain',
          value: match[0],
        });
        if (match[0].includes('\n')) {
          atLineStart = true;
          expectSubcommand = false;
          inArgs = false;
        }
        index += match[0].length;
        continue;
      }
    }

    if (character === '#') {
      const newline = code.indexOf('\n', index);
      const value =
        newline === -1 ? code.slice(index) : code.slice(index, newline);
      tokens.push({
        type: 'comment',
        value,
      });
      index += value.length;
      continue;
    }

    if (character === "'" || character === '"') {
      const re =
        character === "'" ? /^'(?:\\.|[^'\\])*'/ : /^"(?:\\.|[^"\\])*"/;
      const match = re.exec(code.slice(index));
      if (match) {
        tokens.push({
          type: 'string',
          value: match[0],
        });
        index += match[0].length;
        continue;
      }
    }

    if (character === '$') {
      const braced = /^\$\{[^}]+\}/.exec(code.slice(index));
      if (braced) {
        tokens.push({
          type: 'bash-var',
          value: braced[0],
        });
        index += braced[0].length;
        continue;
      }
      const plain = /^\$[A-Za-z_][\w]*/.exec(code.slice(index));
      if (plain) {
        tokens.push({
          type: 'bash-var',
          value: plain[0],
        });
        index += plain[0].length;
        continue;
      }
    }

    if (character === '-') {
      const previous = index > 0 ? (code[index - 1] ?? '') : '';
      const isWordContinuation = /[A-Za-z0-9_./@-]/.test(previous);
      if (!isWordContinuation) {
        const flag = /^--?[A-Za-z][\w-]*/.exec(code.slice(index));
        if (flag) {
          tokens.push({
            type: 'bash-flag',
            value: flag[0],
          });
          index += flag[0].length;
          continue;
        }
      }
    }

    if (character >= '0' && character <= '9') {
      const previous = index > 0 ? (code[index - 1] ?? '') : '';
      const isWordContinuation = /[A-Za-z_]/.test(previous);
      if (!isWordContinuation) {
        const match = /^\d+(?:\.\d+)?/.exec(code.slice(index));
        if (match) {
          tokens.push({
            type: 'number',
            value: match[0],
          });
          index += match[0].length;
          continue;
        }
      }
    }

    if (atLineStart && /[A-Za-z_]/.test(character)) {
      const match = /^[A-Za-z_][\w-]*/.exec(code.slice(index));
      if (match) {
        tokens.push({
          type: 'fn-call',
          value: match[0],
        });
        atLineStart = false;
        if (SUBCOMMAND_TOOLS.has(match[0])) {
          expectSubcommand = true;
        }
        index += match[0].length;
        continue;
      }
    }

    if (expectSubcommand && /[A-Za-z_]/.test(character)) {
      const match = /^[A-Za-z_][\w-]*/.exec(code.slice(index));
      if (match) {
        tokens.push({
          type: 'bash-subcommand',
          value: match[0],
        });
        expectSubcommand = false;
        inArgs = true;
        index += match[0].length;
        continue;
      }
    }

    if (inArgs && /[@A-Za-z_]/.test(character)) {
      const match = /^@?[\w][\w./@-]*/.exec(code.slice(index));
      if (match) {
        tokens.push({
          type: 'bash-package',
          value: match[0],
        });
        index += match[0].length;
        continue;
      }
    }

    if (character !== '\n') {
      atLineStart = false;
    }
    tokens.push({
      type: 'plain',
      value: character,
    });
    index++;
  }
  return mergePlainTokens(tokens);
}
