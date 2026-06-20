export type LocaleCode = 'sv' | 'es' | 'ja' | 'de';

export type Locale = {
  code: LocaleCode;
  filename: string;
};

export const LOCALES: Locale[] = [
  {
    code: 'sv',
    filename: 'sv.json',
  },
  {
    code: 'es',
    filename: 'es.json',
  },
  {
    code: 'ja',
    filename: 'ja.json',
  },
  {
    code: 'de',
    filename: 'de.json',
  },
];

export type Scene = {
  source: string;
  translations: Record<LocaleCode, string>;
};

export const INITIAL_SCENE: Scene = {
  source: 'Welcome back',
  translations: {
    de: 'Willkommen zurück',
    es: 'Bienvenido de nuevo',
    ja: 'おかえりなさい',
    sv: 'Välkommen tillbaka',
  },
};

export const SCENES: Scene[] = [
  {
    source: 'Made just for you',
    translations: {
      de: 'Genau für dich gemacht',
      es: 'Hecho solo para ti',
      ja: 'あなただけのために',
      sv: 'Skapat just för dig',
    },
  },
  {
    source: 'Continue watching',
    translations: {
      de: 'Weiterschauen',
      es: 'Continuar viendo',
      ja: '続きを見る',
      sv: 'Fortsätt titta',
    },
  },
  {
    source: 'Trending right now',
    translations: {
      de: 'Gerade im Trend',
      es: 'Tendencias del momento',
      ja: '今のトレンド',
      sv: 'Populärt just nu',
    },
  },
];

export const EMPTY_TRANSLATIONS: Record<LocaleCode, string> = {
  de: '',
  es: '',
  ja: '',
  sv: '',
};
