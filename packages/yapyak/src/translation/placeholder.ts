export function hasPlaceholder(template: string): boolean {
  const openIndex = template.indexOf('{');
  if (openIndex === -1) {
    return false;
  }
  return template.indexOf('}', openIndex + 1) !== -1;
}
