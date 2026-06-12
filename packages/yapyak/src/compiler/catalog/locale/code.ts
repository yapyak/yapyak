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

const GRANDFATHERED_TAGS: ReadonlySet<string> = new Set([
  'art-lojban',
  'cel-gaulish',
  'en-GB-oed',
  'i-ami',
  'i-bnn',
  'i-default',
  'i-enochian',
  'i-hak',
  'i-klingon',
  'i-lux',
  'i-mingo',
  'i-navajo',
  'i-pwn',
  'i-tao',
  'i-tay',
  'i-tsu',
  'no-bok',
  'no-nyn',
  'sgn-BE-FR',
  'sgn-BE-NL',
  'sgn-CH-DE',
  'zh-guoyu',
  'zh-hakka',
  'zh-min',
  'zh-min-nan',
  'zh-xiang',
]);

const BCP47_RX = (() => {
  const language = '(?:[a-z]{2,3}(?:-[a-z]{3}){0,3}|[a-z]{4}|[a-z]{5,8})';
  const script = '(?:-[A-Z][a-z]{3})?';
  const region = '(?:-(?:[A-Z]{2}|\\d{3}))?';
  const variant = '(?:-(?:[a-z0-9]{5,8}|\\d[a-z0-9]{3}))*';
  const extension = '(?:-[0-9a-wy-z](?:-[a-z0-9]{2,8})+)*';
  const privateuse = '(?:-x(?:-[a-z0-9]{1,8})+)?';
  const langtag = language + script + region + variant + extension + privateuse;
  const purePrivateuse = 'x(?:-[a-z0-9]{1,8})+';
  return new RegExp(`^(?:${langtag}|${purePrivateuse})$`);
})();

export type LocaleIssue = 'invalid-structure' | 'unknown-language';

export type LocaleValidation = {
  issue?: LocaleIssue;
  suggestion?: string;
  valid: boolean;
};

export function validateLocaleCode(code: string): LocaleValidation {
  if (GRANDFATHERED_TAGS.has(code)) {
    return {
      valid: true,
    };
  }
  if (!BCP47_RX.test(code)) {
    const lowered = code.toLowerCase();
    const suggestion = findClosestSuggestion(
      lowered.split(/[-_]/)[0] ?? lowered,
    );
    if (suggestion) {
      return {
        issue: 'invalid-structure',
        suggestion,
        valid: false,
      };
    }
    return {
      issue: 'invalid-structure',
      valid: false,
    };
  }
  const language = (code.split('-')[0] ?? code).toLowerCase();
  if (language === 'x') {
    return {
      valid: true,
    };
  }
  if (ISO_639_1.has(language)) {
    return {
      valid: true,
    };
  }
  if (language.length === 3) {
    return {
      valid: true,
    };
  }
  const suggestion = findClosestSuggestion(language);
  if (suggestion) {
    return {
      issue: 'unknown-language',
      suggestion,
      valid: false,
    };
  }
  return {
    issue: 'unknown-language',
    valid: false,
  };
}

const COMMON_CODES: string[] = [
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

function findClosestSuggestion(input: string): string | undefined {
  if (input.length === 0) {
    return undefined;
  }
  const fromCommon = findClosestIn(input, COMMON_CODES);
  if (fromCommon) {
    return fromCommon;
  }
  return findClosestIn(input, ISO_639_1);
}

function findClosestIn(
  input: string,
  candidates: Iterable<string>,
): string | undefined {
  let best:
    | {
        code: string;
        distance: number;
      }
    | undefined;
  for (const code of candidates) {
    const distance = levenshtein(input, code);
    if (distance > 2) {
      continue;
    }
    if (!best || distance < best.distance) {
      best = {
        code,
        distance,
      };
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
  let previous: number[] = Array.from(
    {
      length: b.length + 1,
    },
    (_, index) => index,
  );
  let current: number[] = new Array(b.length + 1).fill(0);
  for (let aIndex = 1; aIndex <= a.length; aIndex++) {
    current[0] = aIndex;
    for (let bIndex = 1; bIndex <= b.length; bIndex++) {
      const cost = a[aIndex - 1] === b[bIndex - 1] ? 0 : 1;
      current[bIndex] = Math.min(
        (current[bIndex - 1] ?? 0) + 1,
        (previous[bIndex] ?? 0) + 1,
        (previous[bIndex - 1] ?? 0) + cost,
      );
    }
    [previous, current] = [
      current,
      previous,
    ];
  }
  return previous[b.length] ?? 0;
}
