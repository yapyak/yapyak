const UNKNOWN = 'unknown';

export function resolvePackageManager(): string {
  const userAgent = resolveUserAgent();
  if (userAgent === undefined) {
    return UNKNOWN;
  }
  return userAgent.replace('/', ' ');
}

export function resolveRunCommand(script: string): string {
  const name = resolveUserAgent()?.split('/')[0];
  if (name === undefined || name === 'npm') {
    return `npm run ${script}`;
  }
  return `${name} ${script}`;
}

function resolveUserAgent(): string | undefined {
  const firstToken = process.env.npm_config_user_agent?.split(' ')[0];
  if (firstToken === undefined || firstToken === '') {
    return undefined;
  }
  return firstToken;
}
