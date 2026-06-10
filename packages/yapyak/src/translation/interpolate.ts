import type { Template } from '../template';

import { interpret, parseTemplate } from '../template';

const templateCache = new Map<string, Template>();

export function interpolate(
  template: string,
  params: Record<string, unknown>,
  locale: string,
): string {
  let ast = templateCache.get(template);
  if (ast === undefined) {
    ast = parseTemplate(template);
    templateCache.set(template, ast);
  }
  return interpret(ast, params, locale);
}
