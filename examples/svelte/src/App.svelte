<script lang="ts">
  import { useLocale } from 'yapyak/svelte';
  import { getLocales } from 'yapyak';
  import { t } from './translations';

  const locale = useLocale();
  const locales = getLocales();
</script>

<main style="font-family: system-ui; padding: 2rem;">
  <h1>{t.hello}</h1>
  <p>{t.intro}</p>
  <p>{t.greeting({ name: 'Joakim' })}</p>

  <label>
    {t.switchLocale}
    <select bind:value={locale.current}>
      {#each locales as code (code)}
        <option value={code}>{code.toUpperCase()}</option>
      {/each}
    </select>
  </label>
</main>
