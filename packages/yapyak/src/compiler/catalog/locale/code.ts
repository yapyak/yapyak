const ISO_639_1: ReadonlySet<string> = new Set([
  'aa',
  'ab',
  'ae',
  'af',
  'ak',
  'am',
  'an',
  'ar',
  'as',
  'av',
  'ay',
  'az',
  'ba',
  'be',
  'bg',
  'bh',
  'bi',
  'bm',
  'bn',
  'bo',
  'br',
  'bs',
  'ca',
  'ce',
  'ch',
  'co',
  'cr',
  'cs',
  'cu',
  'cv',
  'cy',
  'da',
  'de',
  'dv',
  'dz',
  'ee',
  'el',
  'en',
  'eo',
  'es',
  'et',
  'eu',
  'fa',
  'ff',
  'fi',
  'fj',
  'fo',
  'fr',
  'fy',
  'ga',
  'gd',
  'gl',
  'gn',
  'gu',
  'gv',
  'ha',
  'he',
  'hi',
  'ho',
  'hr',
  'ht',
  'hu',
  'hy',
  'hz',
  'ia',
  'id',
  'ie',
  'ig',
  'ii',
  'ik',
  'io',
  'is',
  'it',
  'iu',
  'ja',
  'jv',
  'ka',
  'kg',
  'ki',
  'kj',
  'kk',
  'kl',
  'km',
  'kn',
  'ko',
  'kr',
  'ks',
  'ku',
  'kv',
  'kw',
  'ky',
  'la',
  'lb',
  'lg',
  'li',
  'ln',
  'lo',
  'lt',
  'lu',
  'lv',
  'mg',
  'mh',
  'mi',
  'mk',
  'ml',
  'mn',
  'mr',
  'ms',
  'mt',
  'my',
  'na',
  'nb',
  'nd',
  'ne',
  'ng',
  'nl',
  'nn',
  'no',
  'nr',
  'nv',
  'ny',
  'oc',
  'oj',
  'om',
  'or',
  'os',
  'pa',
  'pi',
  'pl',
  'ps',
  'pt',
  'qu',
  'rm',
  'rn',
  'ro',
  'ru',
  'rw',
  'sa',
  'sc',
  'sd',
  'se',
  'sg',
  'si',
  'sk',
  'sl',
  'sm',
  'sn',
  'so',
  'sq',
  'sr',
  'ss',
  'st',
  'su',
  'sv',
  'sw',
  'ta',
  'te',
  'tg',
  'th',
  'ti',
  'tk',
  'tl',
  'tn',
  'to',
  'tr',
  'ts',
  'tt',
  'tw',
  'ty',
  'ug',
  'uk',
  'ur',
  'uz',
  've',
  'vi',
  'vo',
  'wa',
  'wo',
  'xh',
  'yi',
  'yo',
  'za',
  'zh',
  'zu',
]);

const BCP47_RX = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/;

export type LocaleIssue = 'invalid-structure' | 'unknown-language';

export interface LocaleValidation {
  issue?: LocaleIssue;
  suggestion?: string;
  valid: boolean;
}

export function validateLocaleCode(code: string): LocaleValidation {
  if (!BCP47_RX.test(code)) {
    const lowered = code.toLowerCase();
    const suggestion = suggestClosest(lowered.split(/[-_]/)[0] ?? lowered);
    if (suggestion) {
      return { issue: 'invalid-structure', suggestion, valid: false };
    }
    return { issue: 'invalid-structure', valid: false };
  }
  const language = (code.split('-')[0] ?? code).toLowerCase();
  if (ISO_639_1.has(language)) {
    return { valid: true };
  }
  const suggestion = suggestClosest(language);
  if (suggestion) {
    return { issue: 'unknown-language', suggestion, valid: false };
  }
  return { issue: 'unknown-language', valid: false };
}

const COMMON_CODES: readonly string[] = [
  'ar',
  'cs',
  'da',
  'de',
  'el',
  'en',
  'es',
  'fa',
  'fi',
  'fr',
  'he',
  'hi',
  'hu',
  'id',
  'is',
  'it',
  'ja',
  'ko',
  'nb',
  'nl',
  'nn',
  'no',
  'pl',
  'pt',
  'ro',
  'ru',
  'sv',
  'th',
  'tr',
  'uk',
  'vi',
  'zh',
];

function suggestClosest(input: string): string | undefined {
  if (input.length === 0) {
    return undefined;
  }
  const fromCommon = closestIn(input, COMMON_CODES);
  if (fromCommon) {
    return fromCommon;
  }
  return closestIn(input, ISO_639_1);
}

function closestIn(
  input: string,
  candidates: Iterable<string>,
): string | undefined {
  let best: { code: string; distance: number } | undefined;
  for (const code of candidates) {
    const distance = levenshtein(input, code);
    if (distance > 2) {
      continue;
    }
    if (!best || distance < best.distance) {
      best = { code, distance };
    }
  }
  return best?.code;
}

function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }
  let previous: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current: number[] = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
    }
    [previous, current] = [current, previous];
  }
  return previous[b.length] ?? 0;
}
