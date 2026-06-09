import type { PackageContext } from './extract/typedoc';

export function encodeSymbolSegment(name: string): string {
  return name.replace(/^\$/, '');
}

export function buildSymbolHref(
  moduleId: string,
  name: string,
  context: PackageContext,
): string {
  const safeName = encodeSymbolSegment(name);
  if (moduleId === context.packageName) {
    return `/${context.collectionName}/${context.packageSlug}/${safeName}`;
  }
  const subSlug = moduleId.slice(context.packageName.length + 1);
  return `/${context.collectionName}/${context.packageSlug}/${subSlug}/${safeName}`;
}
