export function findMatchingBrace(source: string, openIdx: number): number {
  let depth = 1;
  let i = openIdx + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
    i += 1;
  }
  return source.length;
}
