export const RUNTIME_ID = 'yapyak/runtime';
export const RUNTIME_CORE_IDS: string[] = [
  'yapyak',
  'yapyak/internal',
];
export const RUNTIME_RESOLVED = '\0yapyak:runtime';
export const RUNTIME_NO_EXTERNAL: (string | RegExp)[] = [
  'yapyak',
  /^@yapyak\//,
];

export function isRuntimeExternal(id: string): boolean {
  return RUNTIME_NO_EXTERNAL.some((pattern) =>
    typeof pattern === 'string' ? pattern === id : pattern.test(id),
  );
}
