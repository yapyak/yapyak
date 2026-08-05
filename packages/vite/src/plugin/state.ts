import type { Logger } from 'vite';
import type { Diagnostic, ExtractedMessage } from 'yapyak/compiler/internal';
import type { NormalizedYapyakConfig } from 'yapyak/config/internal';
import type { LocaleResolver } from '../locale-resolver';

export type State = {
  autoTranslateController?: AbortController;
  command: 'build' | 'serve';
  configFile?: string;
  extractionCache: Map<
    string,
    {
      callSiteCount: number;
      diagnostics: Diagnostic[];
      messages: ExtractedMessage[];
      source: string;
    }
  >;
  filter: (path: string) => boolean;
  fixedLocale?: string;
  logger: Logger;
  messagesByFile: Map<string, ExtractedMessage[]>;
  normalized?: NormalizedYapyakConfig;
  projectRoot: string;
  resolver?: LocaleResolver;
  teardownCallbacks: (() => void)[];
  yapyakDir: string;
};

export type CreateStateOptions = {
  fixedLocale?: string;
};

export function createState(options: CreateStateOptions = {}): State {
  return {
    command: 'serve',
    extractionCache: new Map(),
    filter: () => false,
    ...(options.fixedLocale !== undefined && {
      fixedLocale: options.fixedLocale,
    }),
    logger: createConsoleLogger(),
    messagesByFile: new Map(),
    projectRoot: process.cwd(),
    teardownCallbacks: [],
    yapyakDir: '',
  };
}

export function getNormalized(state: State): NormalizedYapyakConfig {
  if (state.normalized === undefined) {
    throw new Error(
      '[yapyak] plugin used before configResolved — config is not loaded yet.',
    );
  }
  return state.normalized;
}

export function getResolver(state: State): LocaleResolver {
  if (state.resolver === undefined) {
    throw new Error(
      '[yapyak] plugin used before configResolved — config is not loaded yet.',
    );
  }
  return state.resolver;
}

function createConsoleLogger(): Logger {
  const noop = (): void => undefined;
  return {
    clearScreen: noop,
    error: (message) => {
      console.error(message);
    },
    hasErrorLogged: () => false,
    hasWarned: false,
    info: (message) => {
      console.log(message);
    },
    warn: (message) => {
      console.warn(message);
    },
    warnOnce: (message) => {
      console.warn(message);
    },
  };
}
