export function px(value: number): string {
  if (value === 0) {
    return '0';
  }
  return `${value}px`;
}
