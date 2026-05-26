export function encodeSymbolSegment(name: string): string {
  return name.replace(/^\$/, '');
}

export function symbolHref(
  moduleId: string,
  name: string,
  collectionName: string,
  packageName: string,
  packageSlug: string,
): string {
  const safeName = encodeSymbolSegment(name);
  if (moduleId === packageName) {
    return `/${collectionName}/${packageSlug}/${safeName}`;
  }
  const subSlug = moduleId.slice(packageName.length + 1);
  return `/${collectionName}/${packageSlug}/${subSlug}/${safeName}`;
}
