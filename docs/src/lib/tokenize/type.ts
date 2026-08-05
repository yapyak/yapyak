export type Language =
  | 'tsx'
  | 'ts'
  | 'jsx'
  | 'js'
  | 'svelte'
  | 'vue'
  | 'astro'
  | 'bash'
  | 'json'
  | 'diff'
  | 'html'
  | 'yaml'
  | 'translation';

export type TokenKind =
  | 'plain'
  | 'keyword'
  | 'type'
  | 'literal'
  | 'string'
  | 'template'
  | 'number'
  | 'comment'
  | 'fn-call'
  | 'jsx-tag'
  | 'jsx-brace'
  | 'punct'
  | 'spread'
  | 'regex'
  | 'decorator'
  | 't-call'
  | 't-source'
  | 't-yapyak'
  | 't-placeholder'
  | 't-icu-keyword'
  | 't-icu-key'
  | 't-icu-hash'
  | 't-tag'
  | 'diff-add'
  | 'diff-remove'
  | 'diff-hunk'
  | 'bash-var'
  | 'bash-flag'
  | 'bash-subcommand'
  | 'bash-package'
  | 'bash-placeholder';

export type Token = {
  kind: TokenKind;
  value: string;
};
