import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { color, confirm, header, indent, prompt, symbol } from '../tui.js';

export interface InitOptions {
  projectRoot: string;
}

export async function init(options: InitOptions): Promise<void> {
  const { projectRoot } = options;

  process.stdout.write(
    header(
      'yapyak',
      'Translation that lives where you code.',
    ),
  );

  const defaultLocale = await prompt('Default locale (one you write in)', 'en');
  const othersInput = await prompt('Other locales (comma-separated)', 'sv');
  const others = othersInput
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value !== '' && value !== defaultLocale);
  const locales = [defaultLocale, ...others];

  process.stdout.write('\n');
  const wantTranslator = await confirm(
    'Use Anthropic for auto-translate?',
    true,
  );
  let apiKey = '';
  if (wantTranslator) {
    process.stdout.write(
      indent(
        color.dim(
          'Get one at https://console.anthropic.com/settings/keys',
        ),
        2,
      ) + '\n',
    );
    apiKey = await prompt('  API key (leave empty to add later)');
  }

  process.stdout.write(`\n  ${color.dim('Setting up your project…')}\n\n`);

  const localesDir = join(projectRoot, 'locales');
  if (!existsSync(localesDir)) {
    mkdirSync(localesDir, { recursive: true });
  }
  let createdLocaleFiles = 0;
  for (const locale of locales) {
    const path = join(localesDir, `${locale}.json`);
    if (!existsSync(path)) {
      writeFileSync(path, '');
      createdLocaleFiles++;
    }
  }
  process.stdout.write(
    `  ${symbol.check} ${color.bold('locales/')}${color.dim(
      ` (${createdLocaleFiles} files)`,
    )}\n`,
  );

  if (apiKey !== '') {
    const envPath = join(projectRoot, '.env.local');
    const existing = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';
    const next = existing.includes('ANTHROPIC_API_KEY=')
      ? existing.replace(
          /ANTHROPIC_API_KEY=.*/,
          `ANTHROPIC_API_KEY=${apiKey}`,
        )
      : `${existing}${existing.endsWith('\n') || existing === '' ? '' : '\n'}ANTHROPIC_API_KEY=${apiKey}\n`;
    writeFileSync(envPath, next);
    process.stdout.write(
      `  ${symbol.check} ${color.bold('.env.local')}${color.dim(
        '  ANTHROPIC_API_KEY set',
      )}\n`,
    );
  }

  process.stdout.write(
    `\n  ${color.bold('Next:')} add the plugin to your ${color.cyan('vite.config.ts')}\n\n`,
  );
  process.stdout.write(renderConfigSnippet(locales, defaultLocale, wantTranslator));
  process.stdout.write(
    `\n  ${color.dim('Then run')} ${color.cyan('pnpm dev')} ${color.dim('and start writing')} ${color.cyan('defineTranslations({...})')} ${color.dim('in your components.')}\n\n`,
  );
}

function renderConfigSnippet(
  locales: string[],
  defaultLocale: string,
  withTranslator: boolean,
): string {
  const lines: string[] = [];
  lines.push(`  import { yapyak } from 'yapyak/vite';`);
  if (withTranslator) {
    lines.push(`  import { anthropic } from 'yapyak/translators/anthropic';`);
  }
  lines.push(`  import { defineConfig, loadEnv } from 'vite';`);
  lines.push('');
  lines.push(`  export default defineConfig(({ mode }) => {`);
  if (withTranslator) {
    lines.push(`    const env = loadEnv(mode, process.cwd(), '');`);
  }
  lines.push(`    return {`);
  lines.push(`      plugins: [`);
  lines.push(`        yapyak({`);
  lines.push(`          defaultLocale: '${defaultLocale}',`);
  lines.push(`          locales: ${JSON.stringify(locales)},`);
  lines.push(`          persistence: 'cookie',`);
  if (withTranslator) {
    lines.push(`          translator: anthropic({ apiKey: env.ANTHROPIC_API_KEY }),`);
  }
  lines.push(`        }),`);
  lines.push(`      ],`);
  lines.push(`    };`);
  lines.push(`  });`);
  return lines.map((line) => color.dim(line)).join('\n') + '\n';
}
