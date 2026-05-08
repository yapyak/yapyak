export interface FindBareBindingsOptions {
  code: string;
  intlModules: ReadonlySet<string>;
}

export function findBareBindings(
  options: FindBareBindingsOptions,
): Set<string> {
  const { code, intlModules } = options;
  const bindings = new Set<string>();

  if (intlModules.size === 0) {
    return bindings;
  }

  const importPattern =
    /import\s*(?:type\s+)?\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null = importPattern.exec(code);

  while (match !== null) {
    const importsList = match[1];
    const modulePath = match[2];

    if (importsList && modulePath && intlModules.has(modulePath)) {
      const names = importsList.split(',').map((part) => part.trim());
      for (const name of names) {
        const aliasMatch = name.match(/^t\s+as\s+(\w+)$/);
        if (aliasMatch?.[1]) {
          bindings.add(aliasMatch[1]);
        } else if (name === 't') {
          bindings.add('t');
        }
      }
    }

    match = importPattern.exec(code);
  }

  return bindings;
}
