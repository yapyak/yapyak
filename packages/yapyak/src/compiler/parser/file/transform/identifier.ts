export function isIdentifierCharacter(character: string | undefined): boolean {
  if (!character) {
    return false;
  }
  return /[\w$]/.test(character);
}

export function hasIdentifier(source: string, name: string): boolean {
  let index = source.indexOf(name);
  while (index !== -1) {
    const before = source[index - 1];
    const after = source[index + name.length];
    if (!isIdentifierCharacter(before) && !isIdentifierCharacter(after)) {
      return true;
    }
    index = source.indexOf(name, index + name.length);
  }
  return false;
}

export function findFreeIdentifier(source: string, preferred: string): string {
  if (!hasIdentifier(source, preferred)) {
    return preferred;
  }
  let suffix = 0;
  while (hasIdentifier(source, `${preferred}_$${suffix}`)) {
    suffix += 1;
  }
  return `${preferred}_$${suffix}`;
}

export function findFreeIdentifiers(
  source: string,
  prefix: string,
  count: number,
): string[] {
  const result: string[] = [];
  let index = 0;
  while (result.length < count) {
    const candidate = `${prefix}${index}`;
    if (!hasIdentifier(source, candidate) && !result.includes(candidate)) {
      result.push(candidate);
    }
    index += 1;
  }
  return result;
}
