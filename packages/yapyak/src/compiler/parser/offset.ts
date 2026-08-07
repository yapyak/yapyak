import type { Fragment } from '../../processor';

export function remapOffset(offset: number, fragment: Fragment): number {
  let codeOffset = 0;
  for (const segment of fragment.segments) {
    const codeEnd = codeOffset + segment.codeLength;
    if (offset <= codeEnd) {
      return segment.sourceOffset + offset - codeOffset;
    }
    codeOffset = codeEnd;
  }
  throw new Error(
    `[yapyak] Offset ${offset} is outside the fragment code, which is ${codeOffset} long.`,
  );
}
