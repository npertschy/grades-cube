<script setup lang="ts" generic="T">
import Listbox from "primevue/listbox";
import { toRefs } from "vue";

interface Props {
  entities: T[];
  format: (entity: T) => string;
}

const props = defineProps<Props>();

const { entities, format } = toRefs(props);
const selectedEntity = defineModel<T>();
</script>

<template>
  <listbox
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
  </listbox>
</template>
