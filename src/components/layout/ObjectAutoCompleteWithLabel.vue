<script setup lang="ts" generic="T extends { name: string | undefined }">
import PAutoComplete, { type AutoCompleteCompleteEvent } from "primevue/autocomplete";
import { computed, shallowRef } from "vue";

const { identifier, label, items, option } = defineProps<{
  identifier: string;
  label: string;
  items: T[];
  option: (t: T) => string;
}>();

const value = defineModel<T>();

const query = shallowRef("");
const suggestions = computed<T[]>(
() => {
  if (query.value === "") {
    return items;
  }
  return items.filter((item) => item.name?.includes(query.value));
});
</script>

<template>
  <div>
    <label
      :for="identifier"
      class="font-semibold"
    >
      {{ label }}
    </label>
    <p-auto-complete
      v-model="value"
      :input-id="identifier"
      :suggestions="suggestions"
      :option-label="option"
      class="w-full mt-1"
      input-class="w-full"
      @complete="(event: AutoCompleteCompleteEvent) => query = event.query"
    />
  </div>
</template>
