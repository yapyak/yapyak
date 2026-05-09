import { describe, expect, it } from 'vitest';
import { deriveComponentName } from './derive-component-name';

describe('deriveComponentName', () => {
  it('converts kebab-case basename to PascalCase', () => {
    expect(deriveComponentName('src/components/payment-dialog.tsx')).toBe(
      'PaymentDialog',
    );
  });

  it('uses parent dir when basename is index', () => {
    expect(deriveComponentName('src/routes/checkout/index.tsx')).toBe(
      'Checkout',
    );
  });

  it('strips dollar sign from route param filenames', () => {
    expect(deriveComponentName('src/routes/$slug.tsx')).toBe('Slug');
  });

  it('handles flat single-word filenames', () => {
    expect(deriveComponentName('src/routes/home.tsx')).toBe('Home');
  });

  it('handles snake_case', () => {
    expect(deriveComponentName('src/components/user_card.tsx')).toBe(
      'UserCard',
    );
  });

  it('returns empty string for empty input', () => {
    expect(deriveComponentName('')).toBe('');
  });

  it('handles dot files by skipping leading dots', () => {
    expect(deriveComponentName('src/.config.ts')).toBe('Config');
  });
});
