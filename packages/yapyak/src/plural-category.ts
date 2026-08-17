const CLDR_ORDER = [
  'zero',
  'one',
  'two',
  'few',
  'many',
  'other',
];

export function resolvePluralCategories(
  locale: string,
  type: NonNullable<Intl.PluralRulesOptions['type']>,
): string[] | undefined {
  if (
    Intl.PluralRules.supportedLocalesOf([
      locale,
    ]).length === 0
  ) {
    return undefined;
  }
  return [
    ...new Intl.PluralRules(locale, {
      type,
    }).resolvedOptions().pluralCategories,
  ].sort((a, b) => CLDR_ORDER.indexOf(a) - CLDR_ORDER.indexOf(b));
}
