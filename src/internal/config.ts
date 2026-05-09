export interface YapyakConfig {
  cookieName: string;
  defaultLocale: string;
}

export const config: YapyakConfig = {
  cookieName: 'locale',
  defaultLocale: 'en',
};
