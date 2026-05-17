export type LocaleCode = 'sv' | 'es' | 'ja' | 'de';

export interface Locale {
  code: LocaleCode;
  filename: string;
  flag: string;
  speed: number;
}

export const LOCALES: Locale[] = [
  { code: 'sv', filename: 'sv.json', flag: '🇸🇪', speed: 55 },
  { code: 'es', filename: 'es.json', flag: '🇪🇸', speed: 48 },
  { code: 'ja', filename: 'ja.json', flag: '🇯🇵', speed: 85 },
  { code: 'de', filename: 'de.json', flag: '🇩🇪', speed: 52 },
];

export interface Scene {
  source: string;
  translations: Record<LocaleCode, string>;
}

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
