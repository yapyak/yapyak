import type { Processor } from '../../processor';
import type { Translator } from '../../translator';
import type { FilterPattern } from '../type';

export type NormalizedPersistence =
  | { type: 'cookie'; name: string }
  | { type: 'local-storage'; key: string }
  | { type: 'url'; match?: RegExp }
  | null;

export interface NormalizedYapyakConfig {
  autoTranslateThreshold: number;
  defaultLocale: string | undefined;
  detectAcceptLanguage: boolean;
  examples: number;
  exclude: FilterPattern;
  include: FilterPattern;
  localesDir: string;
  persistence: NormalizedPersistence;
  preserveTranslationsOnRename: boolean;
  processors: Processor[];
  syncHtmlLang: boolean;
  translator: Translator | undefined;
}
