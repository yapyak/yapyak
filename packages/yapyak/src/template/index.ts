export type { TemplateDiagnostic } from './diagnostic';
export type { Template, TemplateNode } from './node';

export {
  count,
  date,
  literal,
  number,
  placeholder,
  plural,
  select,
  time,
} from './factory';
export { interpret } from './interpret';
export { parseTemplate } from './parse';
export {
  type Placeholder,
  type PlaceholderKind,
  extractPlaceholders,
} from './placeholder';
