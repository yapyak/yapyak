export function nullify<T>(value: T | undefined): T | null {
  return value ?? null;
}
