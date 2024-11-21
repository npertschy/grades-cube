<script setup lang="ts" generic="T">
import PListbox from "primevue/listbox";

const { entities, format } = defineProps<{
  entities: T[];
  format: (entity: T) => string;
}>();

const selectedEntity = defineModel<T>();
</script>

<template>
  <p-listbox
    v-model="selectedEntity"
    :options="entities"
    class="min-h-full shadow-2"
    list-style="max-height:75vh"
    :data-key="format"
  >
    <template #option="slotProps">
      <p class="text-center">
        {{ format(slotProps.option) }}
      </p>
    </template>
  </p-listbox>
</template>
