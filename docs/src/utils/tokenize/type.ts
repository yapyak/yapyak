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

export type TokenType =
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
  | 'diff-add'
  | 'diff-remove'
  | 'diff-hunk'
  | 'bash-var'
  | 'bash-flag'
  | 'bash-subcommand'
  | 'bash-package';

export type Token = {
  type: TokenType;
  value: string;
};
