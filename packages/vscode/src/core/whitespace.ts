export function isWhitespace(character: string | undefined): boolean {
  return (
    character === ' ' ||
    character === '\n' ||
    character === '\r' ||
    character === '\t'
  );
}

export function skipWhitespace(text: string, start: number): number {
  let index = start;
  while (index < text.length && isWhitespace(text[index])) {
    index += 1;
  }
  return index;
}
