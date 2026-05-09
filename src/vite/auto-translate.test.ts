import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  BatchTranslateInput,
  Provider,
  TranslateInput,
} from '../ai/index.js';
import { createAutoTranslator } from './auto-translate.js';

describe('auto-translate context flow', () => {
  let projectRoot: string;
  let captured: TranslateInput[];
  let capturedBatch: BatchTranslateInput[];

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-test-'));
    mkdirSync(join(projectRoot, 'src'), { recursive: true });
    mkdirSync(join(projectRoot, 'locales'), { recursive: true });
    writeFileSync(join(projectRoot, 'locales', 'en.json'), '{}');
    writeFileSync(join(projectRoot, 'locales', 'sv.json'), '{}');
    captured = [];
    capturedBatch = [];
  });

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true });
  });

  function makeProvider(): Provider {
    return {
      async translate(input) {
        captured.push(input);
        return `[${input.targetLocale}] ${input.source}`;
      },
      async translateBatch(input) {
        capturedBatch.push(input);
        return input.sources.map((s) => `[${input.targetLocale}] ${s}`);
      },
    };
  }

  it('forwards componentName, fileId, and snippet to provider on single translate', async () => {
    const filePath = join(projectRoot, 'src', 'cancel-button.tsx');
    writeFileSync(
      filePath,
      `import { t } from 'yapyak';\nexport function CancelButton() {\n  return <button>{t('Cancel')}</button>;\n}\n`,
    );

    const translator = createAutoTranslator({
      defaultLocale: 'en',
      factories: ['intl'],
      glossary: {},
      intlModules: ['yapyak'],
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      provider: { translate: makeProvider().translate },
      voice: '',
    });

    await translator.onSourceFileChange(filePath);

    expect(captured).toHaveLength(1);
    const call = captured[0];
    expect(call?.context?.componentName).toBe('CancelButton');
    expect(call?.context?.fileId).toBe('src/cancel-button.tsx');
    expect(call?.context?.snippet).toContain('<button>');
    expect(call?.context?.snippet).toContain("t('Cancel')");
  });

  it('reuses translation when same source moves to a new file', async () => {
    writeFileSync(
      join(projectRoot, 'locales', 'en.json'),
      JSON.stringify({
        'src/old-place.tsx': { Save: 'Save' },
      }),
    );
    writeFileSync(
      join(projectRoot, 'locales', 'sv.json'),
      JSON.stringify({
        'src/old-place.tsx': { Save: 'Spara' },
      }),
    );

    const newFile = join(projectRoot, 'src', 'new-place.tsx');
    writeFileSync(
      newFile,
      `import { t } from 'yapyak';\nexport function NewPlace() { return <button>{t('Save')}</button>; }\n`,
    );

    const translator = createAutoTranslator({
      defaultLocale: 'en',
      factories: ['intl'],
      glossary: {},
      intlModules: ['yapyak'],
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      provider: makeProvider(),
      voice: '',
    });

    await translator.onSourceFileChange(newFile);

    expect(captured).toHaveLength(0);
    expect(capturedBatch).toHaveLength(0);

    const svJson = JSON.parse(
      require('node:fs').readFileSync(
        join(projectRoot, 'locales', 'sv.json'),
        'utf8',
      ),
    );
    expect(svJson['src/new-place.tsx']?.Save).toBe('Spara');
  });

  it('still calls LLM for genuinely new strings even when other files exist', async () => {
    writeFileSync(
      join(projectRoot, 'locales', 'en.json'),
      JSON.stringify({
        'src/old.tsx': { Save: 'Save' },
      }),
    );
    writeFileSync(
      join(projectRoot, 'locales', 'sv.json'),
      JSON.stringify({
        'src/old.tsx': { Save: 'Spara' },
      }),
    );

    const newFile = join(projectRoot, 'src', 'new.tsx');
    writeFileSync(
      newFile,
      `import { t } from 'yapyak';\nexport function New() { return <><h1>{t('Save')}</h1><p>{t('Brand new string')}</p></>; }\n`,
    );

    const translator = createAutoTranslator({
      defaultLocale: 'en',
      factories: ['intl'],
      glossary: {},
      intlModules: ['yapyak'],
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      provider: makeProvider(),
      voice: '',
    });

    await translator.onSourceFileChange(newFile);

    expect(capturedBatch).toHaveLength(0);
    expect(captured).toHaveLength(1);
    expect(captured[0]?.source).toBe('Brand new string');
  });

  it('forwards parallel contexts on batch translate', async () => {
    const filePath = join(projectRoot, 'src', 'payment-dialog.tsx');
    writeFileSync(
      filePath,
      [
        `import { t } from 'yapyak';`,
        `export function PaymentDialog() {`,
        `  return (`,
        `    <div>`,
        `      <h1>{t('Confirm payment')}</h1>`,
        `      <button>{t('Cancel')}</button>`,
        `    </div>`,
        `  );`,
        `}`,
      ].join('\n'),
    );

    const translator = createAutoTranslator({
      defaultLocale: 'en',
      factories: ['intl'],
      glossary: {},
      intlModules: ['yapyak'],
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      provider: makeProvider(),
      voice: '',
    });

    await translator.onSourceFileChange(filePath);

    expect(capturedBatch).toHaveLength(1);
    const batch = capturedBatch[0];
    expect(batch?.contexts).toHaveLength(2);
    expect(batch?.contexts?.[0]?.componentName).toBe('PaymentDialog');
    expect(batch?.contexts?.[1]?.componentName).toBe('PaymentDialog');
    expect(batch?.contexts?.[0]?.snippet).toContain('Confirm payment');
    expect(batch?.contexts?.[1]?.snippet).toContain('Cancel');
  });
});
