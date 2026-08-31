import { expect, test } from './test';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

type Catalog = Record<string, Record<string, string | Record<string, string>>>;

const execFileAsync = promisify(execFile);

const SANDBOX_URL = new URL('../sandbox/', import.meta.url);
const SANDBOX_PATH = fileURLToPath(SANDBOX_URL);
const YAPYAK_BIN_PATH = fileURLToPath(
  new URL('../../packages/yapyak/dist/cli/bin.js', import.meta.url),
);
const APP_PATH = fileURLToPath(new URL('src/app.tsx', SANDBOX_URL));
const CART_PATH = fileURLToPath(new URL('src/cart.tsx', SANDBOX_URL));
const MOVED_CART_PATH = fileURLToPath(
  new URL('src/checkout/cart.tsx', SANDBOX_URL),
);
const ORPHAN_PATH = fileURLToPath(new URL('.yapyak/orphans.json', SANDBOX_URL));
const TEMPLATE_APP_PATH = fileURLToPath(
  new URL('template/app.tsx', SANDBOX_URL),
);
const TEMPLATE_CART_PATH = fileURLToPath(
  new URL('template/cart.tsx', SANDBOX_URL),
);
const TEMPLATE_CATALOG_PATH = fileURLToPath(
  new URL('template/sv.json', SANDBOX_URL),
);

const BASELINE: Catalog = {
  'src/app.tsx': {
    Hello: 'Hej',
    Save: 'Spara',
  },
  'src/cart.tsx': {
    Settings: 'Laddar...',
  },
};

const SETTLE_TIMEOUT = 1000;
const SETTLE_INTERVAL = 100;

test.beforeEach(async ({ page }) => {
  await resetSandbox();
  await validateSettledCatalog('sv', BASELINE);

  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      level: 1,
    }),
  ).toHaveText('Hello');
  await page.waitForLoadState('networkidle');
});

test('writes the translation when a new `t()` call is saved', async ({
  page,
}) => {
  let loadCount = 0;
  page.on('load', () => {
    loadCount += 1;
  });
  await writeApp((template) =>
    template.replace(
      "<p>{t('Save')}</p>",
      "<p>{t('Save')}</p>\n      <p>{t('Cancel')}</p>",
    ),
  );

  await expect(page.getByText('Cancel')).toBeVisible();
  expect(loadCount).toBe(0);
  await expect(async () => {
    expect((await readCatalog('sv'))['src/app.tsx']).toEqual({
      Cancel: 'Avbryt',
      Hello: 'Hej',
      Save: 'Spara',
    });
  }).toPass();

  await page
    .getByRole('button', {
      name: 'sv',
    })
    .click();
  await expect(page.getByText('Avbryt')).toBeVisible();
});

test('preserves the input value when the source is saved', async ({ page }) => {
  let loadCount = 0;
  page.on('load', () => {
    loadCount += 1;
  });
  await page.getByRole('textbox').fill('World');
  await writeApp((template) =>
    template.replace(
      'value={draft}\n      />',
      "value={draft}\n      />\n      <p>{t('Cancel')}</p>",
    ),
  );

  await expect(page.getByText('Cancel')).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveValue('World');
  expect(loadCount).toBe(0);
});

test('renders the switched locale inside a memoized concise component', async ({
  page,
}) => {
  let loadCount = 0;
  page.on('load', () => {
    loadCount += 1;
  });
  await writeFile(
    CART_PATH,
    [
      "import { memo } from 'react';",
      "import { t } from 'yapyak';",
      '',
      "const Label = () => <p>{t('Settings')}</p>;",
      '',
      'export const Cart = memo(() => <Label />);',
      '',
    ].join('\n'),
  );

  await expect(page.getByText('Settings')).toBeVisible();
  await page
    .getByRole('button', {
      name: 'sv',
    })
    .click();
  await expect(page.getByText('Laddar...')).toBeVisible();
  expect(loadCount).toBe(0);
});

test.fail(
  'preserves an uncontrolled input value when the source is saved',
  async ({ page }) => {
    await writeApp((template) =>
      template
        .replace(/<input[\s\S]*?\/>/, '<input />')
        .replace('<input />', "<input />\n      <p>{t('Cancel')}</p>"),
    );
    await expect(page.getByText('Cancel')).toBeVisible();

    await page.getByRole('textbox').fill('World');
    await writeApp((template) =>
      template
        .replace(/<input[\s\S]*?\/>/, '<input />')
        .replace(
          '<input />',
          "<input />\n      <p>{t('Cancel')}</p>\n      <p>{t('Save changes')}</p>",
        ),
    );

    await expect(page.getByText('Save changes')).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveValue('World');
  },
);

test('falls back to the source string until the translation arrives', async ({
  page,
}) => {
  await page
    .getByRole('button', {
      name: 'sv',
    })
    .click();
  await expect(
    page.getByRole('heading', {
      level: 1,
    }),
  ).toHaveText('Hej');

  await writeApp((template) =>
    template.replace(
      "<p>{t('Save')}</p>",
      "<p>{t('Save')}</p>\n      <p>{t('Cancel')}</p>",
    ),
  );

  await expect(page.getByText('Cancel')).toBeVisible();
  await expect(page.getByText('Avbryt')).toBeVisible();
});

test('writes both context translations when `t.as()` homonyms are saved', async ({
  page,
}) => {
  await writeApp((template) =>
    template.replace(
      "<p>{t('Save')}</p>",
      "<p>{t('Save')}</p>\n      <p>{t.as('button', 'Open')}</p>\n      <p>{t.as('badge', 'Open')}</p>",
    ),
  );

  await expect(async () => {
    expect((await readCatalog('sv'))['src/app.tsx']).toEqual({
      Hello: 'Hej',
      Open: {
        badge: 'Öppen',
        button: 'Öppna',
      },
      Save: 'Spara',
    });
  }).toPass();

  await page
    .getByRole('button', {
      name: 'sv',
    })
    .click();
  await expect(page.getByText('Öppna')).toBeVisible();
  await expect(page.getByText('Öppen')).toBeVisible();
});

test('preserves the translation when a source string is edited in place', async ({
  page,
}) => {
  await writeApp((template) =>
    template.replace("t('Save')", "t('Save changes')"),
  );

  await expect(page.getByText('Save changes')).toBeVisible();
  await validateSettledCatalog('sv', {
    'src/app.tsx': {
      Hello: 'Hej',
      'Save changes': 'Spara',
    },
    'src/cart.tsx': {
      Settings: 'Laddar...',
    },
  });
});

test('preserves the translation when a removed `t()` call returns', async ({
  page,
}) => {
  await writeCatalog('sv', {
    ...BASELINE,
    'src/app.tsx': {
      Hello: 'Hej',
      Save: 'Byt konto',
    },
  });
  await page
    .getByRole('button', {
      name: 'sv',
    })
    .click();
  await expect(page.getByText('Byt konto')).toBeVisible();

  await writeApp((template) =>
    template.replace("      <p>{t('Save')}</p>\n", ''),
  );
  await expect(async () => {
    expect((await readCatalog('sv'))['src/app.tsx']).toEqual({
      Hello: 'Hej',
    });
  }).toPass();

  await copyFile(TEMPLATE_APP_PATH, APP_PATH);
  await validateSettledCatalog('sv', {
    'src/app.tsx': {
      Hello: 'Hej',
      Save: 'Byt konto',
    },
    'src/cart.tsx': {
      Settings: 'Laddar...',
    },
  });
});

test('preserves the translation when the source file moves', async () => {
  const cart = await readFile(TEMPLATE_CART_PATH, 'utf8');
  await mkdir(dirname(MOVED_CART_PATH), {
    recursive: true,
  });
  await writeFile(MOVED_CART_PATH, cart);
  await writeApp((template) => template.replace('./cart', './checkout/cart'));
  await rm(CART_PATH, {
    force: true,
  });

  await validateSettledCatalog('sv', {
    'src/app.tsx': {
      Hello: 'Hej',
      Save: 'Spara',
    },
    'src/checkout/cart.tsx': {
      Settings: 'Laddar...',
    },
  });
});

test('skips auto-translate when a save exceeds `autoTranslateThreshold`', async ({
  page,
}) => {
  let loadCount = 0;
  page.on('load', () => {
    loadCount += 1;
  });
  await writeApp((template) =>
    template.replace(
      "<p>{t('Save')}</p>",
      "<p>{t('Save')}</p>\n      <p>{t('World')}</p>\n      <p>{t('Loading...')}</p>\n      <p>{t('Switch account')}</p>\n      <p>{t('Unnamed account')}</p>",
    ),
  );

  await validateSettledCatalog('sv', {
    'src/app.tsx': {
      Hello: 'Hej',
      'Loading...': '',
      Save: 'Spara',
      'Switch account': '',
      'Unnamed account': '',
      World: '',
    },
    'src/cart.tsx': {
      Settings: 'Laddar...',
    },
  });
  expect(loadCount).toBe(0);
});

test('writes the skipped translations when `yapyak translate` runs', async () => {
  await writeApp((template) =>
    template.replace(
      "<p>{t('Save')}</p>",
      "<p>{t('Save')}</p>\n      <p>{t('World')}</p>\n      <p>{t('Loading...')}</p>\n      <p>{t('Switch account')}</p>\n      <p>{t('Unnamed account')}</p>",
    ),
  );
  await expect(async () => {
    expect((await readCatalog('sv'))['src/app.tsx']).toEqual({
      Hello: 'Hej',
      'Loading...': '',
      Save: 'Spara',
      'Switch account': '',
      'Unnamed account': '',
      World: '',
    });
  }).toPass();

  await execFileAsync(
    'node',
    [
      YAPYAK_BIN_PATH,
      'translate',
    ],
    {
      cwd: SANDBOX_PATH,
    },
  );

  await expect(async () => {
    expect((await readCatalog('sv'))['src/app.tsx']).toEqual({
      Hello: 'Hej',
      'Loading...': 'Laddar...',
      Save: 'Spara',
      'Switch account': 'Byt konto',
      'Unnamed account': 'Namnlöst konto',
      World: 'Världen',
    });
  }).toPass();
});

test('renders the translation when the catalog is edited by hand', async ({
  page,
}) => {
  let loadCount = 0;
  page.on('load', () => {
    loadCount += 1;
  });
  await page
    .getByRole('button', {
      name: 'sv',
    })
    .click();
  await expect(page.getByText('Spara')).toBeVisible();

  await writeCatalog('sv', {
    ...BASELINE,
    'src/app.tsx': {
      Hello: 'Hej',
      Save: 'Byt konto',
    },
  });

  await expect(page.getByText('Byt konto')).toBeVisible();
  expect(loadCount).toBe(0);
});

test('preserves a hand-edited translation when the source is saved again', async ({
  page,
}) => {
  await writeCatalog('sv', {
    ...BASELINE,
    'src/app.tsx': {
      Hello: 'Hej',
      Save: 'Byt konto',
    },
  });
  await page
    .getByRole('button', {
      name: 'sv',
    })
    .click();
  await expect(page.getByText('Byt konto')).toBeVisible();

  await writeApp((template) =>
    template.replace(
      "<p>{t('Save')}</p>",
      "<p>{t('Save')}</p>\n      <p>{t('Cancel')}</p>",
    ),
  );

  await validateSettledCatalog('sv', {
    'src/app.tsx': {
      Cancel: 'Avbryt',
      Hello: 'Hej',
      Save: 'Byt konto',
    },
    'src/cart.tsx': {
      Settings: 'Laddar...',
    },
  });
});

test('renders the translation when a broken catalog save is fixed', async ({
  page,
}) => {
  await page
    .getByRole('button', {
      name: 'sv',
    })
    .click();
  await expect(page.getByText('Spara')).toBeVisible();

  await writeFile(toCatalogPath('sv'), '{ broken');
  const deadline = Date.now() + SETTLE_TIMEOUT;
  while (Date.now() < deadline) {
    await setTimeout(SETTLE_INTERVAL);
    await expect(page.getByText('Spara')).toBeVisible();
  }

  await writeCatalog('sv', {
    ...BASELINE,
    'src/app.tsx': {
      Hello: 'Hej',
      Save: 'Byt konto',
    },
  });
  await expect(page.getByText('Byt konto')).toBeVisible();
});

test('writes every translation when `yapyak add` runs', async () => {
  await execFileAsync(
    'node',
    [
      YAPYAK_BIN_PATH,
      'add',
      'de',
    ],
    {
      cwd: SANDBOX_PATH,
    },
  );

  await expect(async () => {
    expect(await readCatalog('de')).toEqual({
      'src/app.tsx': {
        Hello: 'Hallo',
        Save: 'Speichern',
      },
      'src/cart.tsx': {
        Settings: 'Einstellungen',
      },
    });
  }).toPass();
});

test('renders the translation when a locale is added while the server runs', async ({
  page,
}) => {
  await writeCatalog('de', {
    'src/app.tsx': {
      Hello: 'Hallo',
      Save: 'Speichern',
    },
    'src/cart.tsx': {
      Settings: 'Einstellungen',
    },
  });

  await page
    .getByRole('button', {
      name: 'de',
    })
    .click();
  await expect(
    page.getByRole('heading', {
      level: 1,
    }),
  ).toHaveText('Hallo');
});

async function resetSandbox(): Promise<void> {
  await rm(dirname(MOVED_CART_PATH), {
    force: true,
    recursive: true,
  });
  await rm(toCatalogPath('de'), {
    force: true,
  });
  await rm(ORPHAN_PATH, {
    force: true,
  });
  await copyFile(TEMPLATE_APP_PATH, APP_PATH);
  await copyFile(TEMPLATE_CART_PATH, CART_PATH);
  await copyFile(TEMPLATE_CATALOG_PATH, toCatalogPath('sv'));
}

function toCatalogPath(locale: string): string {
  return fileURLToPath(new URL(`locales/${locale}.json`, SANDBOX_URL));
}

async function readCatalog(locale: string): Promise<Catalog> {
  const catalog: Catalog = JSON.parse(
    await readFile(toCatalogPath(locale), 'utf8'),
  );
  return catalog;
}

async function validateSettledCatalog(
  locale: string,
  expected: Catalog,
): Promise<void> {
  await expect(async () => {
    expect(await readCatalog(locale)).toEqual(expected);
  }).toPass();
  const deadline = Date.now() + SETTLE_TIMEOUT;
  while (Date.now() < deadline) {
    await setTimeout(SETTLE_INTERVAL);
    expect(await readCatalog(locale)).toEqual(expected);
  }
}

async function writeCatalog(locale: string, catalog: Catalog): Promise<void> {
  await writeFile(
    toCatalogPath(locale),
    `${JSON.stringify(catalog, null, 2)}\n`,
  );
}

async function writeApp(
  transform: (template: string) => string,
): Promise<void> {
  const template = await readFile(TEMPLATE_APP_PATH, 'utf8');
  await writeFile(APP_PATH, transform(template));
}
