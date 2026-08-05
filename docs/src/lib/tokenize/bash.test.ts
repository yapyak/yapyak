import { describe, expect, it } from 'vitest';

import { tokenizeBash } from './bash';

function types(code: string) {
  return tokenizeBash(code)
    .filter((token) => token.kind !== 'plain')
    .map((token) => token.kind);
}

describe('tokenizeBash', () => {
  it('returns a `comment` token for a `#` line', () => {
    expect(types('# Hello')).toEqual([
      'comment',
    ]);
  });

  it('returns a `string` token for a double-quoted value', () => {
    expect(types('echo "Hello"')).toContain('string');
  });

  it('returns a `bash-var` token for a `$VAR` reference', () => {
    expect(types('echo $HOME')).toContain('bash-var');
  });

  // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
  it('returns a `bash-var` token for a `${VAR}` reference', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
    expect(types('echo ${HOME}')).toContain('bash-var');
  });

  it('returns a `bash-flag` token for a `--flag` argument', () => {
    expect(types('cmd --hello')).toContain('bash-flag');
  });

  it('returns a `bash-subcommand` token for the word after `pnpm`', () => {
    expect(types('pnpm install')).toContain('bash-subcommand');
  });

  it('returns a `bash-package` token for a package name after a subcommand', () => {
    expect(types('pnpm add yapyak')).toContain('bash-package');
  });

  it('returns a `fn-call` token for the first word on a line', () => {
    expect(types('cmd')).toContain('fn-call');
  });

  it('returns a `number` token for a numeric literal', () => {
    expect(types('sleep 5')).toContain('number');
  });

  it('returns a `bash-placeholder` token for an `<arg>` metavariable', () => {
    expect(types('yapyak add <locale>')).toContain('bash-placeholder');
  });
});
