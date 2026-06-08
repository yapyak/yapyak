import { describe, expect, it } from 'vitest';

import { renderTable } from './table';

describe('renderTable', () => {
  it('builds a table with a header row and a single data row', () => {
    const out = renderTable({
      headers: ['A', 'B'],
      rows: [['Hello', 'World']],
    });
    expect(out).toContain('A');
    expect(out).toContain('Hello');
    expect(out).toContain('World');
  });

  it('pads a cell to match the widest value in its column', () => {
    const out = renderTable({
      headers: ['Name'],
      rows: [['Save'], ['Save changes']],
    });
    const lines = out.split('\n');
    const lineLengths = lines.map((line) => line.length);
    expect(new Set(lineLengths).size).toBe(1);
  });

  it('right-aligns a cell when its column is `right`', () => {
    const out = renderTable({
      align: ['right'],
      headers: ['N'],
      rows: [['1'], ['100']],
    });
    expect(out).toMatch(/│ {3}1 │/);
    expect(out).toMatch(/│ 100 │/);
  });

  it('measures the widest cell of a column when a row is shorter than the headers', () => {
    const out = renderTable({
      headers: ['Name', 'Value'],
      rows: [['Hello']],
    });
    expect(out).toContain('Hello');
    expect(out).toContain('Value');
  });

  it('preserves ANSI sequences in a cell while measuring visual width', () => {
    const colored = '\x1b[31mHello\x1b[0m';
    const out = renderTable({
      headers: ['A'],
      rows: [[colored], ['World']],
    });
    expect(out).toContain(colored);
    const lines = out.split('\n');
    expect(new Set(lines.map((line) => line.length)).size).toBeLessThan(
      lines.length,
    );
  });
});
