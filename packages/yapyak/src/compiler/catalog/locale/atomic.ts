import { renameSync, unlinkSync, writeFileSync } from 'node:fs';

export function writeAtomic(path: string, content: string): void {
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  try {
    writeFileSync(temporaryPath, content);
    renameSync(temporaryPath, path);
  } catch (cause) {
    try {
      unlinkSync(temporaryPath);
    } catch {}
    throw cause;
  }
}

export function writeEachAtomic(
  writes: {
    content: string;
    path: string;
  }[],
): void {
  const staged: {
    finalPath: string;
    temporaryPath: string;
  }[] = [];
  try {
    for (const [index, write] of writes.entries()) {
      const temporaryPath = `${write.path}.${process.pid}.${Date.now()}.${index}.tmp`;
      staged.push({
        finalPath: write.path,
        temporaryPath,
      });
      writeFileSync(temporaryPath, write.content);
    }
  } catch (cause) {
    for (const stage of staged) {
      try {
        unlinkSync(stage.temporaryPath);
      } catch {}
    }
    throw cause;
  }
  for (const [index, stage] of staged.entries()) {
    try {
      renameSync(stage.temporaryPath, stage.finalPath);
    } catch (cause) {
      for (const remaining of staged.slice(index)) {
        try {
          unlinkSync(remaining.temporaryPath);
        } catch {}
      }
      throw cause;
    }
  }
}
