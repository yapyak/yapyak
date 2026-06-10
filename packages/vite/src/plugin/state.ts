import type { Logger } from 'vite';
import type { ExtractedMessage } from 'yapyak/compiler';
import type { NormalizedYapyakConfig } from 'yapyak/config/internal';
import type { LocaleResolver } from '../locale-resolver';

export type State = {
  command: 'build' | 'serve';
  configFile: string | undefined;
  filter: (path: string) => boolean;
  fixedLocale: string | undefined;
  logger: Logger;
  messagesByFile: Map<string, ExtractedMessage[]>;
  normalized: NormalizedYapyakConfig | undefined;
  projectRoot: string;
  resolver: LocaleResolver | undefined;
  teardownCallbacks: Array<() => void>;
  yapyakDir: string;
};

export type CreateStateOptions = {
  fixedLocale: string | undefined;
};

export function createState(options: CreateStateOptions): State {
  return {
    command: 'serve',
    configFile: undefined,
    filter: () => false,
    fixedLocale: options.fixedLocale,
    logger: createConsoleLogger(),
    messagesByFile: new Map(),
    normalized: undefined,
    projectRoot: process.cwd(),
    resolver: undefined,
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
