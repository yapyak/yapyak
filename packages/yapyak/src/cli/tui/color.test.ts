import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { color } from './color';

function setIsTTY(value: boolean | undefined): void {
  Object.assign(process.stdout, {
    isTTY: value,
  });
}

describe('color', () => {
  let originalIsTty: boolean | undefined;
  let originalCi: string | undefined;
  let originalNoColor: string | undefined;

  beforeEach(() => {
    originalIsTty = process.stdout.isTTY;
    originalCi = process.env.CI;
    originalNoColor = process.env.NO_COLOR;
    setIsTTY(true);
    delete process.env.CI;
    delete process.env.NO_COLOR;
  });

  afterEach(() => {
    setIsTTY(originalIsTty);
    if (originalCi === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = originalCi;
    }
    if (originalNoColor === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = originalNoColor;
    }
  });

  it('returns the ANSI-wrapped text for `bold`', () => {
    expect(color.bold('Save')).toBe('\x1b[1mSave\x1b[0m');
  });

  it('returns the ANSI-wrapped text for `cyan`', () => {
    expect(color.cyan('Save')).toBe('\x1b[36mSave\x1b[0m');
  });

  it('returns the ANSI-wrapped text for `dim`', () => {
    expect(color.dim('Save')).toBe('\x1b[2mSave\x1b[0m');
  });

  it('returns the ANSI-wrapped text for `green`', () => {
    expect(color.green('Save')).toBe('\x1b[32mSave\x1b[0m');
  });

  it('returns the ANSI-wrapped text for `red`', () => {
    expect(color.red('Save')).toBe('\x1b[31mSave\x1b[0m');
  });

  it('returns the ANSI-wrapped text for `yellow`', () => {
    expect(color.yellow('Save')).toBe('\x1b[33mSave\x1b[0m');
  });

  it('returns the text unchanged when `NO_COLOR` is set', () => {
    process.env.NO_COLOR = '1';
    expect(color.bold('Save')).toBe('Save');
  });

  it('returns the text unchanged when `CI` is set', () => {
    process.env.CI = 'true';
    expect(color.bold('Save')).toBe('Save');
  });

  it('returns the text unchanged when stdout is not a TTY', () => {
    setIsTTY(undefined);
    expect(color.bold('Save')).toBe('Save');
  });
});
