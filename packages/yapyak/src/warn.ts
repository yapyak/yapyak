export type WarnFn = (message: string, meta?: Record<string, unknown>) => void;

let active: WarnFn = defaultWarn;

export function warn(message: string, meta?: Record<string, unknown>): void {
  active(message, meta);
}

export function setWarn(warn: WarnFn): void {
  active = warn;
}

export function resetWarn(): void {
  active = defaultWarn;
}

function defaultWarn(message: string, meta?: Record<string, unknown>): void {
  if (typeof process !== 'undefined') {
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production' || nodeEnv === 'test') {
      return;
    }
  }
  if (meta) {
    console.warn(`[yapyak] ${message}`, meta);
    return;
  }
  console.warn(`[yapyak] ${message}`);
}
