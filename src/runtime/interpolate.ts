export function hasPlaceholder(template: string): boolean {
  return template.includes('{') && template.includes('}');
}

export function interpolate(
  template: string,
  params: Record<string, unknown>,
): string {
  let result = '';
  let index = 0;
  while (index < template.length) {
    const char = template[index];
    if (char === '{') {
      const end = findMatchingBrace(template, index);
      const token = template.slice(index + 1, end);
      result += renderToken(token, params);
      index = end + 1;
    } else {
      result += char;
      index++;
    }
  }
  return result;
}

function findMatchingBrace(template: string, openAt: number): number {
  let depth = 1;
  let index = openAt + 1;
  while (index < template.length && depth > 0) {
    const char = template[index];
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
    }
    if (depth > 0) {
      index++;
    }
  }
  return index;
}

function renderToken(
  token: string,
  params: Record<string, unknown>,
): string {
  const firstComma = token.indexOf(',');
  if (firstComma === -1) {
    const name = token.trim();
    const value = params[name];
    return value === undefined ? '' : String(value);
  }
  const name = token.slice(0, firstComma).trim();
  const afterName = token.slice(firstComma + 1).trim();
  const secondComma = afterName.indexOf(',');
  const kind =
    secondComma === -1
      ? afterName.trim()
      : afterName.slice(0, secondComma).trim();
  const body =
    secondComma === -1 ? '' : afterName.slice(secondComma + 1).trim();
  const value = params[name];
  if (kind === 'plural' || kind === 'selectordinal') {
    return resolvePlural(body, Number(value), params);
  }
  if (kind === 'select') {
    return resolveSelect(body, String(value), params);
  }
  if (kind === 'number') {
    return value === undefined ? '' : String(value);
  }
  return value === undefined ? '' : String(value);
}

function resolvePlural(
  body: string,
  count: number,
  params: Record<string, unknown>,
): string {
  const branches = parseBranches(body);
  const exact = branches.get(`=${count}`);
  if (exact !== undefined) {
    return interpolate(exact.replace(/#/g, String(count)), params);
  }
  const category = pluralCategory(count);
  const branch = branches.get(category) ?? branches.get('other') ?? '';
  return interpolate(branch.replace(/#/g, String(count)), params);
}

function resolveSelect(
  body: string,
  value: string,
  params: Record<string, unknown>,
): string {
  const branches = parseBranches(body);
  const branch = branches.get(value) ?? branches.get('other') ?? '';
  return interpolate(branch, params);
}

function parseBranches(body: string): Map<string, string> {
  const branches = new Map<string, string>();
  let index = 0;
  while (index < body.length) {
    while (index < body.length && /\s/.test(body[index] ?? '')) {
      index++;
    }
    if (index >= body.length) {
      break;
    }
    let nameEnd = index;
    while (
      nameEnd < body.length &&
      !/\s/.test(body[nameEnd] ?? '') &&
      body[nameEnd] !== '{'
    ) {
      nameEnd++;
    }
    const name = body.slice(index, nameEnd);
    index = nameEnd;
    while (index < body.length && body[index] !== '{') {
      index++;
    }
    if (body[index] !== '{') {
      break;
    }
    const end = findMatchingBrace(body, index);
    branches.set(name, body.slice(index + 1, end));
    index = end + 1;
  }
  return branches;
}

function pluralCategory(count: number): string {
  if (count === 1) {
    return 'one';
  }
  return 'other';
}
