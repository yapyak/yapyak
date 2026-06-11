import { describe, expect, it, vi } from 'vitest';

vi.mock('./Children.astro', () => ({
  default: {
    name: 'Children',
  },
}));

vi.mock('./RichText.astro', () => ({
  default: {
    name: 'RichText',
  },
}));

const { RichText } = await import('./index');

describe('RichText', () => {
  it('builds a compound component that holds the `Children` marker as a property', () => {
    expect(RichText.Children).toBeDefined();
    expect(RichText.Children.name).toBe('Children');
  });

  it('preserves the underlying `RichText.astro` component identity', () => {
    expect(RichText.name).toBe('RichText');
  });
});
