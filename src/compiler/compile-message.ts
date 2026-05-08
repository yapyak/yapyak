import type { IntlInstances } from './intl-instances.js';
import type { IcuNode } from './parse-icu.js';
import { parseIcu } from './parse-icu.js';

export function compileMessage(
  message: string,
  locale: string,
  intl: IntlInstances,
): string {
  const ast = parseIcu(message);
  const usedParams = collectParams(ast);
  const paramName = usedParams.size === 0 ? '' : 'p';
  const body = emitBody(ast, locale, intl, false);

  if (usedParams.size === 0) {
    return `() => ${body}`;
  }

  if (containsBranching(ast)) {
    return `(${paramName}) => { ${body} }`;
  }

  return `(${paramName}) => ${body}`;
}

function emitBody(
  nodes: IcuNode[],
  locale: string,
  intl: IntlInstances,
  inPlural: boolean,
): string {
  if (containsBranching(nodes)) {
    return emitBranching(nodes, locale, intl, inPlural);
  }
  return emitConcat(nodes, inPlural);
}

function emitConcat(nodes: IcuNode[], inPlural: boolean): string {
  if (nodes.length === 0) {
    return `''`;
  }
  const parts = nodes.map((node) => emitConcatNode(node, inPlural));
  return parts.join(' + ');
}

function emitConcatNode(node: IcuNode, inPlural: boolean): string {
  if (node.type === 'literal') {
    return JSON.stringify(node.value);
  }
  if (node.type === 'placeholder') {
    return `p.${node.name}`;
  }
  if (node.type === 'pound' && inPlural) {
    return `n`;
  }
  throw new Error(`Unexpected node type in concat: ${node.type}`);
}

function emitBranching(
  nodes: IcuNode[],
  locale: string,
  intl: IntlInstances,
  inPlural: boolean,
): string {
  if (nodes.length === 1) {
    const node = nodes[0];
    if (node && (node.type === 'plural' || node.type === 'select')) {
      return emitChoice(node, locale, intl);
    }
  }

  const lines: string[] = [`let _result = '';`];
  for (const node of nodes) {
    if (node.type === 'plural' || node.type === 'select') {
      lines.push(`_result += (${emitChoiceExpression(node, locale, intl)});`);
    } else {
      lines.push(`_result += ${emitConcatNode(node, inPlural)};`);
    }
  }
  lines.push(`return _result;`);
  return lines.join(' ');
}

function emitChoice(
  node:
    | Extract<IcuNode, { type: 'plural' }>
    | Extract<IcuNode, { type: 'select' }>,
  locale: string,
  intl: IntlInstances,
): string {
  if (node.type === 'plural') {
    return emitPlural(node, locale, intl);
  }
  return emitSelect(node);
}

function emitChoiceExpression(
  node:
    | Extract<IcuNode, { type: 'plural' }>
    | Extract<IcuNode, { type: 'select' }>,
  locale: string,
  intl: IntlInstances,
): string {
  return `(() => { ${emitChoice(node, locale, intl)} })()`;
}

function emitPlural(
  node: Extract<IcuNode, { type: 'plural' }>,
  locale: string,
  intl: IntlInstances,
): string {
  const lines: string[] = [`const n = p.${node.argument};`];
  const exactCases: [string, IcuNode[]][] = [];
  const categoryCases: [string, IcuNode[]][] = [];
  let otherCase: IcuNode[] | undefined;

  for (const [key, body] of Object.entries(node.cases)) {
    if (key === 'other') {
      otherCase = body;
    } else if (key.startsWith('=')) {
      exactCases.push([key.slice(1), body]);
    } else {
      categoryCases.push([key, body]);
    }
  }

  for (const [value, body] of exactCases) {
    lines.push(
      `if (n === ${value}) return ${emitBody(body, locale, intl, true)};`,
    );
  }

  if (categoryCases.length > 0) {
    const prVar = intl.getPluralRules(locale);
    lines.push(`const _c = ${prVar}.select(n);`);
    for (const [key, body] of categoryCases) {
      lines.push(
        `if (_c === ${JSON.stringify(key)}) return ${emitBody(body, locale, intl, true)};`,
      );
    }
  }

  if (otherCase) {
    lines.push(`return ${emitBody(otherCase, locale, intl, true)};`);
  } else {
    lines.push(`return '';`);
  }

  return lines.join(' ');
}

function emitSelect(node: Extract<IcuNode, { type: 'select' }>): string {
  const lines: string[] = [`const _v = p.${node.argument};`];
  let otherCase: IcuNode[] | undefined;

  for (const [key, body] of Object.entries(node.cases)) {
    if (key === 'other') {
      otherCase = body;
      continue;
    }
    lines.push(
      `if (_v === ${JSON.stringify(key)}) return ${emitBody(body, '', { declarations: [], getPluralRules: () => '' }, false)};`,
    );
  }

  if (otherCase) {
    lines.push(
      `return ${emitBody(otherCase, '', { declarations: [], getPluralRules: () => '' }, false)};`,
    );
  } else {
    lines.push(`return '';`);
  }

  return lines.join(' ');
}

function containsBranching(nodes: IcuNode[]): boolean {
  for (const node of nodes) {
    if (node.type === 'plural' || node.type === 'select') {
      return true;
    }
  }
  return false;
}

function collectParams(nodes: IcuNode[]): Set<string> {
  const params = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'placeholder') {
      params.add(node.name);
    } else if (node.type === 'plural' || node.type === 'select') {
      params.add(node.argument);
      for (const body of Object.values(node.cases)) {
        for (const inner of collectParams(body)) {
          params.add(inner);
        }
      }
    }
  }
  return params;
}
