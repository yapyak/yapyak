import type { Language } from './tokenize';

export type Locale = 'es' | 'fr' | 'ja' | 'sv';

export const LOCALES: Locale[] = [
  'es',
  'fr',
  'ja',
  'sv',
];

export type Framework = 'astro' | 'react' | 'svelte' | 'vue';

export type FrameworkDefinition = {
  filename: string;
  id: Framework;
  label: string;
  language: Language;
};

export const FRAMEWORK_DEFINITIONS: [
  FrameworkDefinition,
  FrameworkDefinition,
  FrameworkDefinition,
  FrameworkDefinition,
] = [
  {
    filename: 'app.tsx',
    id: 'react',
    label: 'React',
    language: 'tsx',
  },
  {
    filename: 'app.vue',
    id: 'vue',
    label: 'Vue',
    language: 'vue',
  },
  {
    filename: 'app.svelte',
    id: 'svelte',
    label: 'Svelte',
    language: 'svelte',
  },
  {
    filename: 'app.astro',
    id: 'astro',
    label: 'Astro',
    language: 'astro',
  },
];

export type Scene = {
  source: string;
  translations: Record<Locale, string>;
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

export const EMPTY_TRANSLATIONS: Record<Locale, string> = {
  es: '',
  fr: '',
  ja: '',
  sv: '',
};
