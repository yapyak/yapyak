export type { MalformedDiagnostic, TemplateDiagnostic } from './diagnostic';
export type { Template, TemplateNode } from './node';
export type { Placeholder } from './placeholder';

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
export { extractPlaceholders } from './placeholder';
