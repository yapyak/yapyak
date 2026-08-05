export type TagIssue =
  | {
      kind: 'unclosed-open';
      name: string;
    }
  | {
      kind: 'unopened-close';
      name: string;
    }
  | {
      kind: 'mismatched-close';
      actual: string;
      expected: string;
    }
  | {
      kind: 'name-missing';
    };

const TAG_NAME_RX = /^[A-Za-z][A-Za-z0-9]*$/;
const NON_TAG_TOKEN_RX = /<([A-Za-z][A-Za-z0-9]*)[\s/]/g;

export function validateRichTextTags(source: string): TagIssue[] {
  const nonTagNames = collectNonTagNames(source);
  const issues: TagIssue[] = [];
  const stack: string[] = [];
  let index = 0;
  while (index < source.length) {
    const openIndex = source.indexOf('<', index);
    if (openIndex === -1) {
      break;
    }
    const closeIndex = source.indexOf('>', openIndex + 1);
    if (closeIndex === -1) {
      break;
    }
    const inner = source.slice(openIndex + 1, closeIndex);
    if (inner === '' || inner === '/') {
      issues.push({
        kind: 'name-missing',
      });
      index = closeIndex + 1;
      continue;
    }
    if (inner.startsWith('/')) {
      const name = inner.slice(1);
      if (TAG_NAME_RX.test(name) && !nonTagNames.has(name)) {
        const top = stack[stack.length - 1];
        if (top === undefined) {
          issues.push({
            kind: 'unopened-close',
            name,
          });
        } else if (top === name) {
          stack.pop();
        } else {
          issues.push({
            actual: name,
            expected: top,
            kind: 'mismatched-close',
          });
        }
      }
      index = closeIndex + 1;
      continue;
    }
    let name = inner;
    let isVoid = false;
    if (name.endsWith('/')) {
      name = name.slice(0, -1).trimEnd();
      isVoid = true;
    }
    if (TAG_NAME_RX.test(name) && !isVoid) {
      stack.push(name);
    }
    index = closeIndex + 1;
  }
  for (const name of stack) {
    issues.push({
      kind: 'unclosed-open',
      name,
    });
  }
  return issues;
}

function collectNonTagNames(source: string): Set<string> {
  const names = new Set<string>();
  NON_TAG_TOKEN_RX.lastIndex = 0;
  let match = NON_TAG_TOKEN_RX.exec(source);
  while (match !== null) {
    const captured = match[1];
    if (captured !== undefined) {
      names.add(captured);
    }
    match = NON_TAG_TOKEN_RX.exec(source);
  }
  return names;
}
