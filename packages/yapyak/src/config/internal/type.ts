import type { NormalizedPersistence } from '../../persistence';
import type { Processor } from '../../processor';
import type { Translator } from '../../translator';
import type { FilterPattern } from '../type';

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
