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

export type LiteralNode = {
  kind: 'literal';
  value: string;
};

export type PlaceholderNode = {
  kind: 'placeholder';
  name: string;
};

export type CountNode = {
  kind: 'count';
};

export type PluralNode = {
  branches: Record<string, Template>;
  kind: 'plural';
  name: string;
  type: 'cardinal' | 'ordinal';
};

export type SelectNode = {
  branches: Record<string, Template>;
  kind: 'select';
  name: string;
};

export type NumberNode = {
  kind: 'number';
  name: string;
  options: Intl.NumberFormatOptions;
};

export type DateNode = {
  kind: 'date';
  name: string;
  style: DateTimeStyle;
};

export type TimeNode = {
  kind: 'time';
  name: string;
  style: DateTimeStyle;
};

export type DateTimeStyle = 'short' | 'medium' | 'long' | 'full';
