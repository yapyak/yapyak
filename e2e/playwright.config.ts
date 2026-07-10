import type { ExampleOptions } from './src/test';

import { defineConfig, devices } from '@playwright/test';

type Example = {
  name: string;
  persistence: ExampleOptions['persistence'];
  port: number;
  serverSwitch: boolean;
};

const IS_CI = process.env.CI !== undefined;

const EXAMPLES: Example[] = [
  {
    name: 'astro-cookie',
    persistence: 'cookie',
    port: 5301,
    serverSwitch: false,
  },
  {
    name: 'react-react-router-cookie',
    persistence: 'cookie',
    port: 5302,
    serverSwitch: true,
  },
  {
    name: 'react-react-router-url',
    persistence: 'url',
    port: 5303,
    serverSwitch: false,
  },
  {
    name: 'react-tanstack-start-cookie',
    persistence: 'cookie',
    port: 5304,
    serverSwitch: true,
  },
  {
    name: 'react-tanstack-start-url',
    persistence: 'url',
    port: 5305,
    serverSwitch: false,
  },
  {
    name: 'react-vanilla-local-storage',
    persistence: 'local-storage',
    port: 5306,
    serverSwitch: false,
  },
  {
    name: 'svelte-sveltekit-cookie',
    persistence: 'cookie',
    port: 5307,
    serverSwitch: true,
  },
  {
    name: 'svelte-sveltekit-url',
    persistence: 'url',
    port: 5308,
    serverSwitch: false,
  },
  {
    name: 'svelte-vanilla-local-storage',
    persistence: 'local-storage',
    port: 5309,
    serverSwitch: false,
  },
  {
    name: 'vue-vanilla-local-storage',
    persistence: 'local-storage',
    port: 5310,
    serverSwitch: false,
  },
];

export default defineConfig<ExampleOptions>({
  forbidOnly: IS_CI,
  projects: EXAMPLES.map((example) => ({
    name: example.name,
    use: {
      ...devices['Desktop Chrome'],
      baseURL: `http://localhost:${example.port}`,
      persistence: example.persistence,
      serverSwitch: example.serverSwitch,
    },
  })),
  retries: IS_CI ? 2 : 0,
  testDir: './src',
  use: {
    trace: 'on-first-retry',
  },
  webServer: EXAMPLES.map((example) => ({
    command: `pnpm --filter @yapyak-examples/${example.name} dev --port ${example.port}`,
    env: {
      ASTRO_DEV_BACKGROUND: '1',
    },
    port: example.port,
  })),
});
