import { docsUrl, isYapCode } from './diagnostics/codes';

export type WarnFn = (message: string, meta?: Record<string, unknown>) => void;

let active: WarnFn = defaultWarn;

export function warn(message: string, meta?: Record<string, unknown>): void {
  active(message, meta);
}

export function setWarn(fn: WarnFn): void {
  active = fn;
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
  const code = meta?.code;
  const prefix = isYapCode(code) ? `[yapyak] ${code} ` : '[yapyak] ';
  const suffix = isYapCode(code) ? `\nSee ${docsUrl(code)}` : '';
  if (meta) {
    console.warn(`${prefix}${message}${suffix}`, meta);
    return;
  }
  console.warn(`${prefix}${message}${suffix}`);
}
