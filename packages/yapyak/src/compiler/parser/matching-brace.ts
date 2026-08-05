export function findMatchingBraceIndex(
  source: string,
  openIndex: number,
): number {
  let depth = 1;
  let index = openIndex + 1;
  while (index < source.length) {
    const character = source[index];
    if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
    index += 1;
  }
  return source.length;
}
