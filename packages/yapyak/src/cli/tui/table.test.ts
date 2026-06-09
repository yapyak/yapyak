import { describe, expect, it } from 'vitest';

import { renderTable } from './table';

describe('renderTable', () => {
  it('builds a table with borders, header separator, and a data row', () => {
    const out = renderTable(['A', 'B'], [['Hello', 'World']]);
    expect(out).toBe(
      [
        '┌───────┬───────┐',
        '│ A     │ B     │',
        '├───────┼───────┤',
        '│ Hello │ World │',
        '└───────┴───────┘',
      ].join('\n'),
    );
  });

  it('builds a column to the width of its widest cell across all rows', () => {
    const out = renderTable(['Name'], [['Save'], ['Save changes']]);
    const lines = out.split('\n');
    expect(new Set(lines.map((line) => line.length)).size).toBe(1);
    expect(out).toContain('│ Save         │');
    expect(out).toContain('│ Save changes │');
  });

  it('right-aligns a cell when its column is `right`', () => {
    const out = renderTable(['N'], [['1'], ['100']], { align: ['right'] });
    expect(out).toMatch(/│ {3}1 │/);
    expect(out).toMatch(/│ 100 │/);
  });

  it('preserves ANSI sequences in a cell and pads by visual width', () => {
    const colored = '\x1b[31mHello\x1b[0m';
    const out = renderTable(['A'], [[colored], ['World']]);
    expect(out).toContain(`│ ${colored} │`);
    expect(out).toContain('│ World │');
  });
});
