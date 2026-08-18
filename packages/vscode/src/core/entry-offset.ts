export function resolveEntryOffset(
  text: string,
  fileId: string,
  source: string,
): number {
  const sectionOffset = text.indexOf(JSON.stringify(fileId));
  if (sectionOffset === -1) {
    return 0;
  }
  const entryOffset = text.indexOf(JSON.stringify(source), sectionOffset);
  if (entryOffset === -1) {
    return sectionOffset;
  }
  return entryOffset;
}
