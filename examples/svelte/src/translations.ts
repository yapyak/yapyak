import { defineTranslations } from 'yapyak/svelte';

export const t = defineTranslations({
  hello: 'Hello, world',
  intro: 'This is the yapyak Svelte example.',
  greeting: 'Hello {name}',
  switchLocale: 'Switch language',
});
