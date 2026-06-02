<script setup lang="ts">
import { computed } from 'vue';
import { locales, t } from 'yapyak';
import { locale, RichText } from '@yapyak/vue';

const date = new Date('2024-01-01T08:30:00Z');

</script>

<template>
  <main style="font-family: system-ui; padding: 2rem; max-width: 720px;">
    <h1>{{ t('Hello there') }}</h1>
    <p>{{ t('This is the {name} example.', { name: 'yapyak' }) }}</p>

    <h2>{{ t('Plurals') }}</h2>
    <p>{{ t('You have {count, plural, one {# message} other {# messages}}', { count: 3 }) }}</p>
    <p>{{ t('You have {count, plural, one {# message} other {# messages}}', { count: 1 }) }}</p>

    <h2>{{ t('Numbers') }}</h2>
    <p>{{ t('Total: {amount, number, percent}', { amount: 0.42 }) }}</p>
    <p>{{ t('Price: {amount, number, currency EUR}', { amount: 99.5 }) }}</p>
    <p>{{ t('Count: {amount, number, integer}', { amount: 42.7 }) }}</p>

    <h2>{{ t('Dates and times') }}</h2>
    <p>{{ t('Updated: {when, date, long}', { when: date }) }}</p>
    <p>{{ t('Updated: {when, date, short}', { when: date }) }}</p>
    <p>{{ t('At: {when, time, short}', { when: date }) }}</p>

    <h2>{{ t('Select') }}</h2>
    <p>{{ t('{role, select, admin {Administrator} editor {Editor} other {Viewer}}', { role: 'editor' }) }}</p>

    <h2>{{ t('Rich text') }}</h2>
    <p>
      <RichText :value="t('Translate <b>everything</b> with <link>yapyak</link>')">
        <template #b="{ children }">
          <strong><component :is="children" /></strong>
        </template>
        <template #link="{ children }">
          <a href="https://yapyak.dev"><component :is="children" /></a>
        </template>
      </RichText>
    </p>

    <h2>{{ t('Switch language') }}</h2>
    <div style="display: flex; gap: 0.5rem;">
      <button
        v-for="value in locales"
        :key="value"
        type="button"
        :disabled="value === locale"
        @click="locale = value"
      >
        {{ value === 'sv' ? t('Swedish') : t('English') }}
      </button>
    </div>
  </main>
</template>
