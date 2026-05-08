export type MessageFunction = (params?: Record<string, unknown>) => string;

export type LocaleModule = Record<string, Record<string, MessageFunction>>;
