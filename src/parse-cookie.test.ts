import { describe, expect, it } from 'vitest';

import { parseCookie } from './parse-cookie';

describe('parseCookie', () => {
  it('returns empty object for empty header', () => {
    expect(parseCookie('')).toEqual({});
  });

  it('parses a single cookie', () => {
    expect(parseCookie('locale=sv')).toEqual({ locale: 'sv' });
  });

  it('parses multiple cookies', () => {
    expect(parseCookie('locale=sv; theme=dark')).toEqual({
      locale: 'sv',
      theme: 'dark',
    });
  });

  it('trims whitespace around names and values', () => {
    expect(parseCookie('  locale  =  sv  ;  theme  =  dark  ')).toEqual({
      locale: 'sv',
      theme: 'dark',
    });
  });

  it('decodes URI-encoded values', () => {
    expect(parseCookie('greeting=Hej%20v%C3%A4rlden')).toEqual({
      greeting: 'Hej världen',
    });
  });

  it('falls back to raw value if decode fails', () => {
    expect(parseCookie('broken=%E0%A4%A')).toEqual({ broken: '%E0%A4%A' });
  });

  it('strips surrounding double quotes from values', () => {
    expect(parseCookie('locale="sv"')).toEqual({ locale: 'sv' });
  });

  it('skips segments without equals sign', () => {
    expect(parseCookie('locale=sv; broken; theme=dark')).toEqual({
      locale: 'sv',
      theme: 'dark',
    });
  });

  it('skips segments with empty name', () => {
    expect(parseCookie('=orphan; locale=sv')).toEqual({ locale: 'sv' });
  });

  it('handles values with equals signs', () => {
    expect(parseCookie('token=abc=def=ghi')).toEqual({
      token: 'abc=def=ghi',
    });
  });
});
