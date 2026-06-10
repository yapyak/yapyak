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
  source: 'Welcome',
  translations: {
    de: 'Willkommen',
    es: 'Bienvenido',
    ja: 'ようこそ',
    sv: 'Välkommen',
  },
};

export const SCENES: Scene[] = [
  {
    source: 'Save changes',
    translations: {
      de: 'Änderungen speichern',
      es: 'Guardar cambios',
      ja: '変更を保存',
      sv: 'Spara ändringar',
    },
  },
  {
    source: 'Your bag is empty',
    translations: {
      de: 'Ihr Warenkorb ist leer',
      es: 'Tu bolsa está vacía',
      ja: 'カートは空です',
      sv: 'Din kundvagn är tom',
    },
  },
  {
    source: 'Continue with Google',
    translations: {
      de: 'Mit Google fortfahren',
      es: 'Continuar con Google',
      ja: 'Googleで続行',
      sv: 'Fortsätt med Google',
    },
  },
];

export const EMPTY_TRANSLATIONS: Record<LocaleCode, string> = {
  de: '',
  es: '',
  ja: '',
  sv: '',
};
