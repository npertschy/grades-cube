<script setup lang="ts" generic="T extends { name: string | undefined }">
import PAutoComplete, { type AutoCompleteCompleteEvent } from "primevue/autocomplete";
import { ref } from "vue";

const { identifier, label, items, option } = defineProps<{
  identifier: string;
  label: string;
  items: T[];
  option: (t: T) => string;
}>();

const value = defineModel<string>();

const suggestions = ref<T[]>([...items]);

function filterSuggestions(event: AutoCompleteCompleteEvent) {
  if (event.query === "") {
    suggestions.value = [...items];
  } else {
    suggestions.value = items.filter((item) => {
      return item.name?.includes(event.query);
    });
  }
}
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
      @complete="filterSuggestions"
    />
  </div>
</template>
