import type { ExampleOptions } from './src/test';

import { defineConfig, devices } from '@playwright/test';

import { fileURLToPath } from 'node:url';

type Mode = 'dev' | 'prod';

type SaveLoop = {
  fileId: string;
  sourceAnchor: string;
  sourceInsertion: string;
  sourcePath: string;
  ssrHtml: boolean;
};

type Example = {
  name: string;
  persistence: ExampleOptions['persistence'];
  port: number;
  saveLoop?: SaveLoop;
  serve: 'preview' | 'start';
  switchLocaleOnServer: boolean;
};

const IS_CI = process.env.CI !== undefined;

const MODE: Mode = process.env.YAPYAK_E2E_MODE === 'prod' ? 'prod' : 'dev';

const PROD_PORT_OFFSET = 100;

const SANDBOX_PORT = 5320;

const EXAMPLES: Example[] = [
  {
    name: 'astro-cookie',
    persistence: 'cookie',
    port: 5301,
    saveLoop: {
      fileId: 'src/pages/index.astro',
      sourceAnchor: "<h2>{t('Dates and times')}</h2>",
      sourceInsertion:
        "<h2>{t('Dates and times')}</h2><p>{t('Probe from the save loop')}</p>",
      sourcePath: 'src/pages/index.astro',
      ssrHtml: true,
    },
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'astro-url',
    persistence: 'url',
    port: 5311,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'react-react-router-cookie',
    persistence: 'cookie',
    port: 5302,
    saveLoop: {
      fileId: 'app/routes/home.tsx',
      sourceAnchor: "<h2>{t('Dates and times')}</h2>",
      sourceInsertion:
        "<h2>{t('Dates and times')}</h2><p>{t('Probe from the save loop')}</p>",
      sourcePath: 'app/routes/home.tsx',
      ssrHtml: true,
    },
    serve: 'start',
    switchLocaleOnServer: true,
  },
  {
    name: 'react-react-router-url',
    persistence: 'url',
    port: 5303,
    serve: 'start',
    switchLocaleOnServer: false,
  },
  {
    name: 'react-tanstack-start-cookie',
    persistence: 'cookie',
    port: 5304,
    saveLoop: {
      fileId: 'src/routes/index.tsx',
      sourceAnchor: "<h2>{t('Dates and times')}</h2>",
      sourceInsertion:
        "<h2>{t('Dates and times')}</h2><p>{t('Probe from the save loop')}</p>",
      sourcePath: 'src/routes/index.tsx',
      ssrHtml: true,
    },
    serve: 'preview',
    switchLocaleOnServer: true,
  },
  {
    name: 'react-tanstack-start-url',
    persistence: 'url',
    port: 5305,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'react-vanilla-cookie',
    persistence: 'cookie',
    port: 5312,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'react-vanilla-local-storage',
    persistence: 'local-storage',
    port: 5306,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'react-vanilla-url',
    persistence: 'url',
    port: 5313,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'svelte-sveltekit-cookie',
    persistence: 'cookie',
    port: 5307,
    saveLoop: {
      fileId: 'src/routes/+page.svelte',
      sourceAnchor: '<h2>{t("Dates and times")}</h2>',
      sourceInsertion:
        '<h2>{t("Dates and times")}</h2><p>{t("Probe from the save loop")}</p>',
      sourcePath: 'src/routes/+page.svelte',
      ssrHtml: true,
    },
    serve: 'preview',
    switchLocaleOnServer: true,
  },
  {
    name: 'svelte-sveltekit-url',
    persistence: 'url',
    port: 5308,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'svelte-vanilla-cookie',
    persistence: 'cookie',
    port: 5314,
    saveLoop: {
      fileId: 'src/app.svelte',
      sourceAnchor: '<h2>{t("Dates and times")}</h2>',
      sourceInsertion:
        '<h2>{t("Dates and times")}</h2><p>{t("Probe from the save loop")}</p>',
      sourcePath: 'src/app.svelte',
      ssrHtml: false,
    },
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'svelte-vanilla-local-storage',
    persistence: 'local-storage',
    port: 5309,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'svelte-vanilla-url',
    persistence: 'url',
    port: 5315,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'vue-vanilla-cookie',
    persistence: 'cookie',
    port: 5316,
    saveLoop: {
      fileId: 'src/app.vue',
      sourceAnchor: "<h2>{{ t('Dates and times') }}</h2>",
      sourceInsertion:
        "<h2>{{ t('Dates and times') }}</h2><p>{{ t('Probe from the save loop') }}</p>",
      sourcePath: 'src/app.vue',
      ssrHtml: false,
    },
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'vue-vanilla-local-storage',
    persistence: 'local-storage',
    port: 5310,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'vue-vanilla-url',
    persistence: 'url',
    port: 5317,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
];

function resolvePort(example: Example): number {
  return MODE === 'prod' ? example.port + PROD_PORT_OFFSET : example.port;
}

function toExamplePath(example: Example, relativePath: string): string {
  return fileURLToPath(
    new URL(`../examples/${example.name}/${relativePath}`, import.meta.url),
  );
}

function resolveCommand(example: Example): string {
  const run = `pnpm --filter @yapyak-examples/${example.name}`;
  if (MODE === 'dev') {
    return `${run} dev --port ${resolvePort(example)}`;
  }
  if (example.serve === 'start') {
    return `PORT=${resolvePort(example)} ${run} start`;
  }
  return `${run} preview --port ${resolvePort(example)}`;
}

export default defineConfig<ExampleOptions>({
  forbidOnly: IS_CI,
  projects: [
    ...EXAMPLES.map((example) => ({
      name: example.name,
      testMatch: 'example.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${resolvePort(example)}`,
        persistence: example.persistence,
        switchLocaleOnServer: example.switchLocaleOnServer,
      },
    })),
    ...(MODE === 'dev'
      ? EXAMPLES.flatMap((example) =>
          example.saveLoop === undefined
            ? []
            : [
                {
                  dependencies: [
                    example.name,
                  ],
                  name: `${example.name}-save-loop`,
                  testMatch: 'example-save-loop.spec.ts',
                  use: {
                    ...devices['Desktop Chrome'],
                    allowHydrationMismatch: true,
                    baseURL: `http://localhost:${resolvePort(example)}`,
                    catalogFileId: example.saveLoop.fileId,
                    catalogPath: toExamplePath(example, 'locales/sv.json'),
                    persistence: example.persistence,
                    sourceAnchor: example.saveLoop.sourceAnchor,
                    sourceInsertion: example.saveLoop.sourceInsertion,
                    sourcePath: toExamplePath(
                      example,
                      example.saveLoop.sourcePath,
                    ),
                    ssrHtml: example.saveLoop.ssrHtml,
                    switchLocaleOnServer: example.switchLocaleOnServer,
                  },
                },
              ],
        )
      : []),
    ...(MODE === 'dev'
      ? [
          {
            name: 'sandbox',
            testMatch: 'save-loop.spec.ts',
            use: {
              ...devices['Desktop Chrome'],
              baseURL: `http://localhost:${SANDBOX_PORT}`,
            },
          },
        ]
      : []),
  ],
  retries: IS_CI ? 2 : 0,
  testDir: './src',
  use: {
    timezoneId: 'Europe/Stockholm',
    trace: 'on-first-retry',
  },
  webServer: [
    ...EXAMPLES.map((example) => ({
      command: resolveCommand(example),
      env: {
        ASTRO_DEV_BACKGROUND: '1',
        TZ: 'Europe/Stockholm',
      },
      port: resolvePort(example),
    })),
    ...(MODE === 'dev'
      ? [
          {
            command: `pnpm --filter @yapyak/e2e-sandbox reset && pnpm --filter @yapyak/e2e-sandbox dev --port ${SANDBOX_PORT}`,
            env: {
              TZ: 'Europe/Stockholm',
            },
            port: SANDBOX_PORT,
          },
        ]
      : []),
  ],
});
