import type { Plugin, ResolvedConfig, UserConfig } from 'vite';
import type { State } from './state';

import { writeRegister } from 'yapyak/compiler';
import { createFilter, loadYapyakConfig } from 'yapyak/config/internal';

import { createLocaleResolver } from '../locale-resolver';
import {
  RUNTIME_ID,
  RUNTIME_NO_EXTERNAL,
  isRuntimeExternal,
} from '../virtual-runtime';
import { renderLocaleWarning } from './locale-warning';
import { join } from 'node:path';

export function createConfigPlugin(state: State): Plugin {
  return {
    config(): UserConfig {
      return {
        optimizeDeps: {
          exclude: [
            RUNTIME_ID,
          ],
        },
        ssr: {
          noExternal: RUNTIME_NO_EXTERNAL,
        },
      };
    },
    async configResolved(config: ResolvedConfig): Promise<void> {
      state.projectRoot = config.root;
      state.yapyakDir = join(state.projectRoot, '.yapyak');
      state.command = config.command;
      state.logger = config.logger;
      const result = await loadYapyakConfig(state.projectRoot);
      state.normalized = result.config;
      state.configFile = result.configFile;
      state.filter = createFilter(result.config.include, result.config.exclude);
      const ssrExternal = config.ssr?.external;
      if (Array.isArray(ssrExternal)) {
        const kept = ssrExternal.filter((id) => !isRuntimeExternal(id));
        ssrExternal.splice(0, ssrExternal.length, ...kept);
      } else if (ssrExternal === true || typeof ssrExternal === 'function') {
        const description =
          typeof ssrExternal === 'function' ? 'a function' : '`true`';
        state.logger.warn(
          `[yapyak] config.ssr.external is set to ${description}. ` +
            `yapyak's runtime must not be externalized for SSR — translations would not inline. ` +
            `Use an array form for ssr.external, or have your function return false/null for 'yapyak' and 'yapyak/runtime'.`,
        );
      }
      state.resolver = createLocaleResolver(
        {
          defaultLocale: result.config.defaultLocale,
          localesDir: result.config.localesDir,
        },
        state.projectRoot,
        {
          fixedLocale: state.fixedLocale,
        },
      );
      const discovery = state.resolver.getDiscovery();
      for (const warning of discovery.warnings) {
        state.logger.warn(
          renderLocaleWarning(warning, result.config.localesDir),
        );
      }
      if (
        state.fixedLocale !== undefined &&
        !discovery.locales.includes(state.fixedLocale)
      ) {
        throw new Error(
          `[yapyak] fixedLocale '${state.fixedLocale}' is not configured in this project. ` +
            `Available locales: ${discovery.locales.join(', ')}. ` +
            `Either add '${state.fixedLocale}' to your locales/ directory or pick an existing locale.`,
        );
      }
      writeRegister(
        state.resolver.getEmittedLocales().locales,
        state.yapyakDir,
      );
    },
    name: 'yapyak:config',
  };
}
