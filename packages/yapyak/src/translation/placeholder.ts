export function hasPlaceholder(template: string): boolean {
  return template.includes('{') && template.includes('}');
}
