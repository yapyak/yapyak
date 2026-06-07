export const RUNTIME_ID = 'yapyak/runtime';
export const RUNTIME_RESOLVED = '\0yapyak:runtime';
export const RUNTIME_NO_EXTERNAL: (string | RegExp)[] = [
  'yapyak',
  /^@yapyak\//,
];

export const HMR_LISTENER: string = [
  'if (import.meta.hot) {',
  "  import.meta.hot.on('yapyak:locale-added', (data) => {",
  // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
  "    console.log(`[yapyak] New locale '${data.locale}' detected. ${data.hint}`);",
  '  });',
  "  import.meta.hot.on('yapyak:locale-removed', (data) => {",
  // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
  "    console.log(`[yapyak] Locale '${data.locale}' removed.`);",
  '  });',
  '}',
].join('\n');

export function isRuntimeExternal(id: string): boolean {
  return RUNTIME_NO_EXTERNAL.some((pattern) =>
    typeof pattern === 'string' ? pattern === id : pattern.test(id),
  );
}
