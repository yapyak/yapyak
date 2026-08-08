import type { Fragment } from '../../processor';

export type ValidateFragmentsInput = {
  fileId: string;
  fragments: Fragment[];
  processorId: string;
  source: string;
};

export function validateFragments(input: ValidateFragmentsInput): void {
  for (const fragment of input.fragments) {
    validateSegments(fragment, input);
  }
}

function validateSegments(
  fragment: Fragment,
  input: ValidateFragmentsInput,
): void {
  let coveredLength = 0;
  for (const segment of fragment.segments) {
    if (!Number.isInteger(segment.codeLength) || segment.codeLength < 0) {
      throw new Error(
        `[yapyak] Processor "${input.processorId}" returned a segment with code length ${segment.codeLength} in ${input.fileId}. A code length is a non-negative integer.`,
      );
    }
    if (
      !Number.isInteger(segment.sourceOffset) ||
      segment.sourceOffset < 0 ||
      segment.sourceOffset > input.source.length
    ) {
      throw new Error(
        `[yapyak] Processor "${input.processorId}" returned a segment at source offset ${segment.sourceOffset} in ${input.fileId}, which is outside the source file.`,
      );
    }
    coveredLength += segment.codeLength;
  }
  if (coveredLength !== fragment.code.length) {
    throw new Error(
      `[yapyak] Processor "${input.processorId}" returned segments covering ${coveredLength} code units for a fragment of ${fragment.code.length} in ${input.fileId}.`,
    );
  }
}
