export interface YapyakConfig {
  cookieName: string;
  defaultLocale: string;
  placeholder: string;
}

export const config: YapyakConfig = {
  cookieName: 'locale',
  defaultLocale: 'en',
  placeholder: '%lang%',
};
