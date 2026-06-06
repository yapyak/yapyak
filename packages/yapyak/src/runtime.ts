import type { Locale } from './locale';
import type { NormalizedPersistenceConfig } from './persistence';

export const LOCALES: Locale[] = [];
export const DEFAULT_LOCALE: Locale = 'en';
export const PERSISTENCE_CONFIG: NormalizedPersistenceConfig = { type: 'none' };
export const DETECT_ACCEPT_LANGUAGE = false;
export const SYNC_HTML_LANG = false;
