import type {
  CountNode,
  DateNode,
  DateTimeStyle,
  LiteralNode,
  NumberNode,
  PlaceholderNode,
  PluralNode,
  SelectNode,
  Template,
  TimeNode,
} from './node';

export function literal(value: string): LiteralNode {
  return {
    kind: 'literal',
    value,
  };
}

export function placeholder(name: string): PlaceholderNode {
  return {
    kind: 'placeholder',
    name,
  };
}

export function count(): CountNode {
  return {
    kind: 'count',
  };
}

export function plural(
  name: string,
  type: 'cardinal' | 'ordinal',
  branches: Record<string, Template>,
): PluralNode {
  return {
    branches: toNullProtoDict(branches),
    kind: 'plural',
    name,
    type,
  };
}

export function select(
  name: string,
  branches: Record<string, Template>,
): SelectNode {
  return {
    branches: toNullProtoDict(branches),
    kind: 'select',
    name,
  };
}

export function number(
  name: string,
  options: Intl.NumberFormatOptions,
): NumberNode {
  return {
    kind: 'number',
    name,
    options,
  };
}

export function date(name: string, style: DateTimeStyle): DateNode {
  return {
    kind: 'date',
    name,
    style,
  };
}

export function time(name: string, style: DateTimeStyle): TimeNode {
  return {
    kind: 'time',
    name,
    style,
  };
}

function toNullProtoDict<T>(source: Record<string, T>): Record<string, T> {
  return Object.assign(Object.create(null) as Record<string, T>, source);
}
