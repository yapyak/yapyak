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

export function writeAtomicAll(
  writes: {
    content: string;
    path: string;
  }[],
): void {
  const staged: {
    finalPath: string;
    tempPath: string;
  }[] = [];
  try {
    for (const [index, write] of writes.entries()) {
      const tempPath = `${write.path}.${process.pid}.${Date.now()}.${index}.tmp`;
      writeFileSync(tempPath, write.content);
      staged.push({
        finalPath: write.path,
        tempPath,
      });
    }
  } catch (cause) {
    for (const stage of staged) {
      try {
        unlinkSync(stage.tempPath);
      } catch {}
    }
    throw cause;
  }
  for (const [index, stage] of staged.entries()) {
    try {
      renameSync(stage.tempPath, stage.finalPath);
    } catch (cause) {
      for (const remaining of staged.slice(index)) {
        try {
          unlinkSync(remaining.tempPath);
        } catch {}
      }
      throw cause;
    }
  }
}
