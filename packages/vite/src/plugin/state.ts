import type { ResolvedConfig } from 'vite';
import type { ExtractedMessage } from 'yapyak/compiler';
import type { NormalizedYapyakConfig } from 'yapyak/config/internal';
import type { LocaleResolver } from '../locale-resolver';

export interface State {
  command: 'build' | 'serve';
  configFile: string | undefined;
  error(message: string): void;
  filter: (path: string) => boolean;
  fixedLocale: string | undefined;
  getNormalized(): NormalizedYapyakConfig;
  getResolver(): LocaleResolver;
  info(message: string): void;
  logger: ResolvedConfig['logger'] | undefined;
  messagesByFile: Map<string, ExtractedMessage[]>;
  normalized: NormalizedYapyakConfig | undefined;
  projectRoot: string;
  resolver: LocaleResolver | undefined;
  teardownCallbacks: Array<() => void>;
  warn(message: string): void;
  yapyakDir: string;
}

export interface CreateStateOptions {
  fixedLocale: string | undefined;
}

export function createState(options: CreateStateOptions): State {
  const state: State = {
    command: 'serve',
    configFile: undefined,
    error(message: string): void {
      if (state.logger !== undefined) {
        state.logger.error(message);
        return;
      }
      console.error(message);
    },
    filter: () => false,
    fixedLocale: options.fixedLocale,
    getNormalized(): NormalizedYapyakConfig {
      if (state.normalized === undefined) {
        throw new Error(
          '[yapyak] plugin used before configResolved — config is not loaded yet.',
        );
      }
      return state.normalized;
    },
    getResolver(): LocaleResolver {
      if (state.resolver === undefined) {
        throw new Error(
          '[yapyak] plugin used before configResolved — config is not loaded yet.',
        );
      }
      return state.resolver;
    },
    info(message: string): void {
      if (state.logger !== undefined) {
        state.logger.info(message);
        return;
      }
      console.log(message);
    },
    logger: undefined,
    messagesByFile: new Map(),
    normalized: undefined,
    projectRoot: process.cwd(),
    resolver: undefined,
    teardownCallbacks: [],
    warn(message: string): void {
      if (state.logger !== undefined) {
        state.logger.warn(message);
        return;
      }
      console.warn(message);
    },
    yapyakDir: '',
  };
  return state;
}
