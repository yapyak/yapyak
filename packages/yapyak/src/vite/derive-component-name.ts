export function deriveComponentName(fileId: string): string {
  const segments = fileId.split('/');
  let basename = segments[segments.length - 1] ?? '';
  basename = basename.replace(/\.[^.]+$/, '');

  if (basename === 'index' || basename === '') {
    basename = segments[segments.length - 2] ?? basename;
  }

  basename = basename.replace(/^\$/, '');
  basename = basename.replace(/^[._]+/, '');

  if (basename === '') {
    return '';
  }

  return basename
    .split(/[-_]/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
