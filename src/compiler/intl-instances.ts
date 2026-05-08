export interface IntlInstances {
  declarations: string[];
  getPluralRules: (locale: string) => string;
}

export function createIntlInstances(): IntlInstances {
  const declarations: string[] = [];
  const cache = new Map<string, string>();

  function getPluralRules(locale: string): string {
    const key = `pr_${locale}`;
    const existing = cache.get(key);
    if (existing) {
      return existing;
    }
    const safeLocale = locale.replace(/[^a-zA-Z0-9]/g, '_');
    const varName = `_pr_${safeLocale}`;
    declarations.push(
      `const ${varName} = new Intl.PluralRules(${JSON.stringify(locale)});`,
    );
    cache.set(key, varName);
    return varName;
  }

  return {
    declarations,
    getPluralRules,
  };
}
