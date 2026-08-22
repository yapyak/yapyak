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
  | 'jsx-attribute'
  | 'jsx-brace'
  | 'punct'
  | 'spread'
  | 'regex'
  | 'decorator'
  | 't-call'
  | 't-source'
  | 't-yapyak'
  | 'icu-punctuation'
  | 'icu-placeholder'
  | 'icu-keyword'
  | 'icu-branch'
  | 'icu-pound'
  | 'icu-tag'
  | 'diff-add'
  | 'diff-remove'
  | 'diff-hunk'
  | 'bash-var'
  | 'bash-flag'
  | 'bash-subcommand'
  | 'bash-package'
  | 'bash-placeholder';

export type SlotPosition = 'start' | 'middle' | 'end' | 'only';

export type Token = {
  kind: TokenKind;
  slot?: SlotPosition;
  value: string;
};
