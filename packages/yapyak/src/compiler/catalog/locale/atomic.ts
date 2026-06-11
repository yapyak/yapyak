import { renameSync, unlinkSync, writeFileSync } from 'node:fs';

export function writeAtomic(path: string, content: string): void {
  const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  try {
    writeFileSync(tempPath, content);
    renameSync(tempPath, path);
  } catch (cause) {
    try {
      unlinkSync(tempPath);
    } catch {}
    throw cause;
  }
}
