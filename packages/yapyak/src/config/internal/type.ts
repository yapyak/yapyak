import type { NormalizedPersistenceConfig } from '../../persistence';
import type { Processor } from '../../processor';
import type { Translator } from '../../translator';
import type { FilterPattern } from '../type';

export interface NormalizedYapyakConfig {
  autoTranslateThreshold: number;
  defaultLocale: string;
  detectAcceptLanguage: boolean;
  examples: number;
  exclude: FilterPattern;
  include: FilterPattern;
  localesDir: string;
  persistence: NormalizedPersistenceConfig;
  preserveTranslationsOnRename: boolean;
  processors: Processor[];
  syncHtmlLang: boolean;
  translator: Translator | undefined;
}
