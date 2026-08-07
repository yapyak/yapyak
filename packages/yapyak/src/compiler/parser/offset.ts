import type { Fragment } from '../../processor';

export function remapOffset(offset: number, fragment: Fragment): number {
  const lastIndex = fragment.segments.length - 1;
  let codeOffset = 0;
  for (const [index, segment] of fragment.segments.entries()) {
    const codeEnd = codeOffset + segment.codeLength;
    const isLastSegment = index === lastIndex;
    if (offset < codeEnd || (isLastSegment && offset === codeEnd)) {
      return segment.sourceOffset + offset - codeOffset;
    }
    codeOffset = codeEnd;
  }
  throw new Error(
    `[yapyak] Offset ${offset} is outside the fragment code, which is ${codeOffset} long.`,
  );
}
