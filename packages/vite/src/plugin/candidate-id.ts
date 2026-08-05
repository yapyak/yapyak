import { toFileId } from './file-id';

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
