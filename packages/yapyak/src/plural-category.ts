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
): string[] {
  return [
    ...new Intl.PluralRules(locale, {
      type,
    }).resolvedOptions().pluralCategories,
  ].sort((a, b) => CLDR_ORDER.indexOf(a) - CLDR_ORDER.indexOf(b));
}
