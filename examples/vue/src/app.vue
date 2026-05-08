<script setup lang="ts">
import { computed } from 'vue';
import { t, useLocale } from 'yapyak';

const locale = useLocale();

const messageCount = computed(() =>
  t('You have {count, plural, one {# message} other {# messages}}', {
    count: 3,
  }),
);
</script>

<template>
  <main style="font-family: system-ui; padding: 2rem;">
    <h1>{{ t('Hello, world') }}</h1>
    <p>{{ t('This is the yapyak Vue example.') }}</p>
    <p>{{ t('Hello {name}', { name: 'Joakim' }) }}</p>
    <p>{{ messageCount }}</p>
    <button type="button" @click="locale = locale === 'en' ? 'sv' : 'en'">
      {{ locale.toUpperCase() }}
    </button>
  </main>
</template>
