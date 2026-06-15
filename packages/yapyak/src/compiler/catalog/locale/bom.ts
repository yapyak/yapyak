export function stripBom(content: string): string {
  if (content.charCodeAt(0) === 0xfe_ff) {
    return content.slice(1);
  }
  return content;
}
