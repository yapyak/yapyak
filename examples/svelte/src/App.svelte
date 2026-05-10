<script lang="ts">
  import { getLocales } from 'yapyak';
  import { t, useLocale } from 'yapyak/svelte';

  const locale = useLocale();
  const locales = getLocales();
</script>

<main style="font-family: system-ui; padding: 2rem;">
  <h1>{t('Hello, world')}</h1>
  <p>{t('This is the yapyak Svelte example.')}</p>
  <p>{t('Hello {name}', { name: 'Joakim' })}</p>

  <label>
    {t('Switch language')}
    <select bind:value={locale.current}>
      {#each locales as code (code)}
        <option value={code}>{code.toUpperCase()}</option>
      {/each}
    </select>
  </label>
</main>
