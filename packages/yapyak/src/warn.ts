export type WarnFn = (message: string, meta?: Record<string, unknown>) => void;

let active: WarnFn = warnToConsole;

export function warn(message: string, meta?: Record<string, unknown>): void {
  active(message, meta);
}

export function setWarn(warn: WarnFn): void {
  active = warn;
}

export function resetWarn(): void {
  active = warnToConsole;
}

function warnToConsole(message: string, meta?: Record<string, unknown>): void {
  if (typeof process !== 'undefined') {
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production' || nodeEnv === 'test') {
      return;
    }
  } else if (!(import.meta.env?.DEV ?? false)) {
    return;
  }
  if (meta) {
    console.warn(`[yapyak] ${message}`, meta);
    return;
  }
  console.warn(`[yapyak] ${message}`);
}
