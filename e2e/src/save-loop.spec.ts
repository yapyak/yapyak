import { expect, test } from './test';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

type Catalog = Record<string, Record<string, string | Record<string, string>>>;

const execFileAsync = promisify(execFile);

const SANDBOX_URL = new URL('../sandbox/', import.meta.url);
const SANDBOX_PATH = fileURLToPath(SANDBOX_URL);
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

test.beforeEach(async ({ page }) => {
  await resetSandbox();
  await expect(async () => {
    expect(await readCatalog('sv')).toEqual(BASELINE);
  }).toPass();
  await page.waitForTimeout(1000);
  expect(await readCatalog('sv')).toEqual(BASELINE);

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

test('preserves the translation when a source string is renamed', async ({
  page,
}) => {
  await writeApp((template) =>
    template.replace("t('Save')", "t('Save changes')"),
  );

  await expect(page.getByText('Save changes')).toBeVisible();
  await expect(async () => {
    expect((await readCatalog('sv'))['src/app.tsx']).toEqual({
      Hello: 'Hej',
      'Save changes': 'Spara',
    });
  }).toPass();

  await page.waitForTimeout(1000);
  expect((await readCatalog('sv'))['src/app.tsx']).toEqual({
    Hello: 'Hej',
    'Save changes': 'Spara',
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
  await expect(async () => {
    expect((await readCatalog('sv'))['src/app.tsx']).toEqual({
      Hello: 'Hej',
      Save: 'Byt konto',
    });
  }).toPass();

  await page.waitForTimeout(1000);
  expect((await readCatalog('sv'))['src/app.tsx']).toEqual({
    Hello: 'Hej',
    Save: 'Byt konto',
  });
});

test('preserves the translation when the source file moves', async ({
  page,
}) => {
  const cart = await readFile(TEMPLATE_CART_PATH, 'utf8');
  await mkdir(dirname(MOVED_CART_PATH), {
    recursive: true,
  });
  await writeFile(MOVED_CART_PATH, cart);
  await writeApp((template) => template.replace('./cart', './checkout/cart'));
  await rm(CART_PATH, {
    force: true,
  });

  await expect(async () => {
    const catalog = await readCatalog('sv');
    expect(catalog['src/checkout/cart.tsx']).toEqual({
      Settings: 'Laddar...',
    });
    expect(catalog['src/cart.tsx']).toBeUndefined();
  }).toPass();

  await page.waitForTimeout(1000);
  expect((await readCatalog('sv'))['src/checkout/cart.tsx']).toEqual({
    Settings: 'Laddar...',
  });
});

test('skips auto-translate when a save exceeds `autoTranslateThreshold`', async ({
  page,
}) => {
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

  await page.waitForTimeout(1000);
  expect((await readCatalog('sv'))['src/app.tsx']).toEqual({
    Hello: 'Hej',
    'Loading...': '',
    Save: 'Spara',
    'Switch account': '',
    'Unnamed account': '',
    World: '',
  });
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
    'pnpm',
    [
      '--filter',
      '@yapyak/sandbox',
      'exec',
      'yapyak',
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

  await expect(async () => {
    expect((await readCatalog('sv'))['src/app.tsx']).toEqual({
      Cancel: 'Avbryt',
      Hello: 'Hej',
      Save: 'Byt konto',
    });
  }).toPass();

  await page.waitForTimeout(1000);
  expect((await readCatalog('sv'))['src/app.tsx']).toEqual({
    Cancel: 'Avbryt',
    Hello: 'Hej',
    Save: 'Byt konto',
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
  await page.waitForTimeout(1000);
  await expect(page.getByText('Spara')).toBeVisible();

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
    'pnpm',
    [
      '--filter',
      '@yapyak/sandbox',
      'exec',
      'yapyak',
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
        Hello: 'Hej',
        Save: 'Spara',
      },
      'src/cart.tsx': {
        Settings: 'Inställningar',
      },
    });
  }).toPass();
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
