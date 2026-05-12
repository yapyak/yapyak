export function cn(
  ...values: (false | null | string | undefined)[]
): string {
  return values.filter(Boolean).join(' ');
}
