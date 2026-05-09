import { describe, expect, it } from 'vitest';
import { buildBatchPrompt, buildPrompt } from './system-prompt';

describe('buildPrompt with context', () => {
  it('includes call-site context block when provided', () => {
    const prompt = buildPrompt({
      context: {
        componentName: 'PaymentDialog',
        fileId: 'src/components/payment-dialog.tsx',
        snippet: "<Button onClick={cancelPayment}>\n  {t('Cancel')}\n</Button>",
      },
      glossary: {},
      source: 'Cancel',
      targetLocale: 'sv',
      voice: '',
    });
    expect(prompt).toContain('Call-site context');
    expect(prompt).toContain('File: src/components/payment-dialog.tsx');
    expect(prompt).toContain('Component: PaymentDialog');
    expect(prompt).toContain('<Button onClick={cancelPayment}>');
  });

  it('omits context block when not provided', () => {
    const prompt = buildPrompt({
      glossary: {},
      source: 'Cancel',
      targetLocale: 'sv',
      voice: '',
    });
    expect(prompt).not.toContain('Call-site context');
    expect(prompt).not.toContain('File:');
  });
});

describe('buildBatchPrompt with contexts', () => {
  it('attaches per-source context inline', () => {
    const prompt = buildBatchPrompt({
      contexts: [
        {
          componentName: 'PaymentDialog',
          fileId: 'src/payment.tsx',
          snippet: "<Button>{t('Cancel')}</Button>",
        },
        {
          componentName: 'LegalNotice',
          fileId: 'src/legal.tsx',
          snippet: "<p>{t('Cancel')}</p>",
        },
      ],
      glossary: {},
      sources: ['Cancel', 'Cancel'],
      targetLocale: 'sv',
      voice: '',
    });
    expect(prompt).toContain('1.');
    expect(prompt).toContain('2.');
    expect(prompt).toContain('Component: PaymentDialog');
    expect(prompt).toContain('Component: LegalNotice');
    expect(prompt).toContain('File: src/payment.tsx');
    expect(prompt).toContain('File: src/legal.tsx');
  });

  it('omits context when not provided', () => {
    const prompt = buildBatchPrompt({
      glossary: {},
      sources: ['Hello', 'World'],
      targetLocale: 'sv',
      voice: '',
    });
    expect(prompt).not.toContain('File:');
    expect(prompt).not.toContain('Component:');
  });
});
