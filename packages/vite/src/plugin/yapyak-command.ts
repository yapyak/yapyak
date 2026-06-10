export function runYapyakCommand(args: string): string {
  const userAgent = process.env.npm_config_user_agent ?? '';
  if (userAgent.startsWith('pnpm/')) {
    return `pnpm yapyak ${args}`;
  }
  if (userAgent.startsWith('yarn/')) {
    return `yarn yapyak ${args}`;
  }
  if (userAgent.startsWith('bun/')) {
    return `bunx yapyak ${args}`;
  }
  return `npx yapyak ${args}`;
}
