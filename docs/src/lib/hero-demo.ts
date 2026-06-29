export type LocaleCode = 'es' | 'fr' | 'ja' | 'sv';

export type DemoLocale = {
  code: LocaleCode;
  filename: string;
};

export const LOCALES: DemoLocale[] = [
  {
    code: 'es',
    filename: 'es.json',
  },
  {
    code: 'fr',
    filename: 'fr.json',
  },
  {
    code: 'ja',
    filename: 'ja.json',
  },
  {
    code: 'sv',
    filename: 'sv.json',
  },
];

export type Scene = {
  source: string;
  translations: Record<LocaleCode, string>;
};

export const INITIAL_SCENE: Scene = {
  source: 'Welcome back',
  translations: {
    es: 'Bienvenido de nuevo',
    fr: 'Bon retour',
    ja: 'おかえりなさい',
    sv: 'Välkommen tillbaka',
  },
};

export const SCENES: Scene[] = [
  {
    source: 'Made just for you',
    translations: {
      es: 'Hecho solo para ti',
      fr: 'Spécialement pour vous',
      ja: 'あなただけのために',
      sv: 'Skapat just för dig',
    },
  },
  {
    source: 'Continue watching',
    translations: {
      es: 'Continuar viendo',
      fr: 'Reprendre la lecture',
      ja: '続きを見る',
      sv: 'Fortsätt titta',
    },
  },
  {
    source: 'Trending right now',
    translations: {
      es: 'Tendencias del momento',
      fr: 'Tendances du moment',
      ja: '今のトレンド',
      sv: 'Populärt just nu',
    },
  },
];

export const EMPTY_TRANSLATIONS: Record<LocaleCode, string> = {
  es: '',
  fr: '',
  ja: '',
  sv: '',
};
