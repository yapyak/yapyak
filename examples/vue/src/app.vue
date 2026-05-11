<script setup lang="ts">
import { computed } from 'vue';
import { getLocales, t } from 'yapyak';
import { locale } from 'yapyak/vue';

const locales = getLocales();
const now = new Date();

const hello = computed(() => locale.value && t('Hello there'));
const intro = computed(
  () => locale.value && t('This is the {name} example.', { name: 'yapyak' }),
);
const plurals = computed(() => locale.value && t('Plurals'));
const pluralMany = computed(
  () =>
    locale.value &&
    t('You have {count, plural, one {# message} other {# messages}}', {
      count: 3,
    }),
);
const pluralOne = computed(
  () =>
    locale.value &&
    t('You have {count, plural, one {# message} other {# messages}}', {
      count: 1,
    }),
);
const numbers = computed(() => locale.value && t('Numbers'));
const percent = computed(
  () => locale.value && t('Total: {amount, number, percent}', { amount: 0.42 }),
);
const currency = computed(
  () =>
    locale.value &&
    t('Price: {amount, number, currency EUR}', { amount: 99.5 }),
);
const integer = computed(
  () =>
    locale.value && t('Count: {amount, number, integer}', { amount: 42.7 }),
);
const datesAndTimes = computed(() => locale.value && t('Dates and times'));
const updatedLong = computed(
  () => locale.value && t('Updated: {when, date, long}', { when: now }),
);
const updatedShort = computed(
  () => locale.value && t('Updated: {when, date, short}', { when: now }),
);
const atTime = computed(
  () => locale.value && t('At: {when, time, short}', { when: now }),
);
const selectLabel = computed(() => locale.value && t('Select'));
const themeMode = computed(
  () =>
    locale.value &&
    t('{theme, select, dark {Dark mode is on} other {Light mode is on}}', {
      theme: 'dark',
    }),
);
const switchLanguage = computed(() => locale.value && t('Switch language'));
</script>

<template>
  <main style="font-family: system-ui; padding: 2rem; max-width: 720px;">
    <h1>{{ hello }}</h1>
    <p>{{ intro }}</p>

    <h2>{{ plurals }}</h2>
    <p>{{ pluralMany }}</p>
    <p>{{ pluralOne }}</p>

    <h2>{{ numbers }}</h2>
    <p>{{ percent }}</p>
    <p>{{ currency }}</p>
    <p>{{ integer }}</p>

    <h2>{{ datesAndTimes }}</h2>
    <p>{{ updatedLong }}</p>
    <p>{{ updatedShort }}</p>
    <p>{{ atTime }}</p>

    <h2>{{ selectLabel }}</h2>
    <p>{{ themeMode }}</p>

    <label>
      {{ switchLanguage }}
      <select v-model="locale">
        <option v-for="code in locales" :key="code" :value="code">
          {{ code.toUpperCase() }}
        </option>
      </select>
    </label>
  </main>
</template>
