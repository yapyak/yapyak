import type { Range } from './range';

export interface ElisionContext {
  attrName?: string;
  mode: 'attribute' | 'text';
  range: Range;
}

export interface Fragment {
  code: string;
  elision?: ElisionContext;
  kind: 'script' | 'template-expression';
  lang: 'js' | 'ts';
  originalOffset: number;
}
