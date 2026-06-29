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
  | 'tx-call'
  | 'tx-source'
  | 'tx-yapyak'
  | 'tx-placeholder'
  | 'tx-icu-keyword'
  | 'tx-icu-key'
  | 'tx-icu-hash'
  | 'tx-tag'
  | 'diff-add'
  | 'diff-remove'
  | 'diff-hunk'
  | 'bash-var'
  | 'bash-flag'
  | 'bash-subcommand'
  | 'bash-package';

export type Token = {
  kind: TokenKind;
  value: string;
};
