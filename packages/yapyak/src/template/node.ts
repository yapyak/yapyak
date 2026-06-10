export type Template = TemplateNode[];

export type TemplateNode =
  | LiteralNode
  | PlaceholderNode
  | CountNode
  | PluralNode
  | SelectNode
  | NumberNode
  | DateNode
  | TimeNode;

export interface LiteralNode {
  kind: 'literal';
  value: string;
}

export interface PlaceholderNode {
  kind: 'placeholder';
  name: string;
}

export interface CountNode {
  kind: 'count';
}

export interface PluralNode {
  branches: Map<string, Template>;
  kind: 'plural';
  name: string;
  type: 'cardinal' | 'ordinal';
}

export interface SelectNode {
  branches: Map<string, Template>;
  kind: 'select';
  name: string;
}

export interface NumberNode {
  kind: 'number';
  name: string;
  options: Intl.NumberFormatOptions;
}

export interface DateNode {
  kind: 'date';
  name: string;
  style: DateTimeStyle;
}

export interface TimeNode {
  kind: 'time';
  name: string;
  style: DateTimeStyle;
}

export type DateTimeStyle = 'short' | 'medium' | 'long' | 'full';
