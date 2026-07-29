export function encodeSymbolSegment(name: string): string {
  return name.replace(/^\$/, '');
}
