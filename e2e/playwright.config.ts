import type { ExampleOptions } from './src/test';

import { defineConfig, devices } from '@playwright/test';

type Mode = 'dev' | 'prod';

type Example = {
  name: string;
  persistence: ExampleOptions['persistence'];
  port: number;
  serve: 'preview' | 'start';
  serverSwitch: boolean;
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
    serve: 'preview',
    serverSwitch: false,
  },
  {
    name: 'astro-url',
    persistence: 'url',
    port: 5311,
    serve: 'preview',
    serverSwitch: false,
  },
  {
    name: 'react-react-router-cookie',
    persistence: 'cookie',
    port: 5302,
    serve: 'start',
    serverSwitch: true,
  },
  {
    name: 'react-react-router-url',
    persistence: 'url',
    port: 5303,
    serve: 'start',
    serverSwitch: false,
  },
  {
    name: 'react-tanstack-start-cookie',
    persistence: 'cookie',
    port: 5304,
    serve: 'preview',
    serverSwitch: true,
  },
  {
    name: 'react-tanstack-start-url',
    persistence: 'url',
    port: 5305,
    serve: 'preview',
    serverSwitch: false,
  },
  {
    name: 'react-vanilla-cookie',
    persistence: 'cookie',
    port: 5312,
    serve: 'preview',
    serverSwitch: false,
  },
  {
    name: 'react-vanilla-local-storage',
    persistence: 'local-storage',
    port: 5306,
    serve: 'preview',
    serverSwitch: false,
  },
  {
    name: 'react-vanilla-url',
    persistence: 'url',
    port: 5313,
    serve: 'preview',
    serverSwitch: false,
  },
  {
    name: 'svelte-sveltekit-cookie',
    persistence: 'cookie',
    port: 5307,
    serve: 'preview',
    serverSwitch: true,
  },
  {
    name: 'svelte-sveltekit-url',
    persistence: 'url',
    port: 5308,
    serve: 'preview',
    serverSwitch: false,
  },
  {
    name: 'svelte-vanilla-cookie',
    persistence: 'cookie',
    port: 5314,
    serve: 'preview',
    serverSwitch: false,
  },
  {
    name: 'svelte-vanilla-local-storage',
    persistence: 'local-storage',
    port: 5309,
    serve: 'preview',
    serverSwitch: false,
  },
  {
    name: 'svelte-vanilla-url',
    persistence: 'url',
    port: 5315,
    serve: 'preview',
    serverSwitch: false,
  },
  {
    name: 'vue-vanilla-cookie',
    persistence: 'cookie',
    port: 5316,
    serve: 'preview',
    serverSwitch: false,
  },
  {
    name: 'vue-vanilla-local-storage',
    persistence: 'local-storage',
    port: 5310,
    serve: 'preview',
    serverSwitch: false,
  },
  {
    name: 'vue-vanilla-url',
    persistence: 'url',
    port: 5317,
    serve: 'preview',
    serverSwitch: false,
  },
];

function resolvePort(example: Example): number {
  return MODE === 'prod' ? example.port + PROD_PORT_OFFSET : example.port;
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
        serverSwitch: example.serverSwitch,
      },
    })),
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
            command: `pnpm --filter @yapyak/sandbox reset && pnpm --filter @yapyak/sandbox dev --port ${SANDBOX_PORT}`,
            env: {
              TZ: 'Europe/Stockholm',
            },
            port: SANDBOX_PORT,
          },
        ]
      : []),
  ],
});
