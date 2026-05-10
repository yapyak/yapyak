<script setup lang="ts">
import { getLocales } from 'yapyak';
import { useLocale } from 'yapyak/vue';
import { t } from './translations';

const locale = useLocale();
const locales = getLocales();
</script>

<template>
  <main style="font-family: system-ui; padding: 2rem;">
    <h1>{{ t.hello }}</h1>
    <p>{{ t.intro }}</p>
    <p>{{ t.greeting({ name: 'Joakim' }) }}</p>

    <label>
      {{ t.switchLocale }}
      <select v-model="locale">
        <option v-for="code in locales" :key="code" :value="code">
          {{ code.toUpperCase() }}
        </option>
      </select>
    </label>
  </main>
</template>
