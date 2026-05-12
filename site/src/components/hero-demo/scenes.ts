export type LocaleCode = 'sv' | 'es' | 'ja' | 'de';

export interface Locale {
  code: LocaleCode;
  flag: string;
  filename: string;
  speed: number;
}

export const LOCALES: Locale[] = [
  { code: 'sv', flag: '🇸🇪', filename: 'sv.json', speed: 55 },
  { code: 'es', flag: '🇪🇸', filename: 'es.json', speed: 48 },
  { code: 'ja', flag: '🇯🇵', filename: 'ja.json', speed: 85 },
  { code: 'de', flag: '🇩🇪', filename: 'de.json', speed: 52 },
];

export interface Scene {
  source: string;
  translations: Record<LocaleCode, string>;
}

export const INITIAL_SCENE: Scene = {
  source: 'Welcome',
  translations: {
    sv: 'Välkommen',
    es: 'Bienvenido',
    ja: 'ようこそ',
    de: 'Willkommen',
  },
};

export const SCENES: Scene[] = [
  {
    source: 'Start your free trial',
    translations: {
      sv: 'Starta din gratis testperiod',
      es: 'Comienza tu prueba gratuita',
      ja: '無料トライアルを始める',
      de: 'Starten Sie Ihre kostenlose Testversion',
    },
  },
  {
    source: 'Your bag is empty',
    translations: {
      sv: 'Din kundvagn är tom',
      es: 'Tu bolsa está vacía',
      ja: 'カートは空です',
      de: 'Ihr Warenkorb ist leer',
    },
  },
  {
    source: 'Continue with Google',
    translations: {
      sv: 'Fortsätt med Google',
      es: 'Continuar con Google',
      ja: 'Googleで続行',
      de: 'Mit Google fortfahren',
    },
  },
];

export const EMPTY_TRANSLATIONS: Record<LocaleCode, string> = {
  sv: '',
  es: '',
  ja: '',
  de: '',
};
