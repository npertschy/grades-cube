<script setup lang="ts">
import PPanel from "primevue/panel";

const { header } = defineProps<{
  header: string;
}>();
</script>

<template>
  <p-panel
    :header="header"
    :pt="{ title: { style: { fontSize: '1.25rem' } } }"
  >
    <slot />
  </p-panel>
</template>
