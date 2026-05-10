<script setup lang="ts">
import { getLocales } from 'yapyak';
import { t, useLocale } from 'yapyak/vue';

const locale = useLocale();
const locales = getLocales();
</script>

<template>
  <main style="font-family: system-ui; padding: 2rem;">
    <h1>{{ t('Hello, world') }}</h1>
    <p>{{ t('This is the yapyak Vue example.') }}</p>
    <p>{{ t('Hello {name}', { name: 'Joakim' }) }}</p>

    <label>
      {{ t('Switch language') }}
      <select v-model="locale">
        <option v-for="code in locales" :key="code" :value="code">
          {{ code.toUpperCase() }}
        </option>
      </select>
    </label>
  </main>
</template>
