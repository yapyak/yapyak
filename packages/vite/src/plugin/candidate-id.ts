import { relative } from 'node:path';

export function isCandidateId(
  id: string,
  filter: (fileId: string) => boolean,
  projectRoot: string,
): boolean {
  if (id.startsWith('\0')) {
    return false;
  }
  return filter(toFileId(projectRoot, id));
}

export function toFileId(projectRoot: string, id: string): string {
  const path = id.split('?')[0] ?? id;
  return relative(projectRoot, path).replaceAll('\\', '/');
}
