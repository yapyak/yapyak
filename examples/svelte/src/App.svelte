<script lang="ts">
  import { locale, t } from 'yapyak';

  const messageCount = $derived(
    t('You have {count, plural, one {# message} other {# messages}}', {
      count: 3,
    }),
  );
</script>

<main style="font-family: system-ui; padding: 2rem;">
  <h1>{t('Hello, world')}</h1>
  <p>{t('This is the yapyak Svelte example.')}</p>
  <p>{t('Hello {name}', { name: 'Joakim' })}</p>
  <p>{messageCount}</p>

  <button
    type="button"
    onclick={() => (locale.current = locale.current === 'en' ? 'sv' : 'en')}
  >
    {locale.current.toUpperCase()}
  </button>
</main>
