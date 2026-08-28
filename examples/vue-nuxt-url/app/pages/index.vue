<script setup lang="ts">
import { defaultLocale } from 'yapyak';

await navigateTo(`/${defaultLocale}`, {
  redirectCode: 307,
  replace: true,
});
</script>

<template>
  <div />
</template>
