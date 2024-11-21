<script setup lang="ts" generic="T">
import PAutoComplete, { type AutoCompleteCompleteEvent } from "primevue/autocomplete";
import { ref, toRefs } from "vue";

const props = defineProps<{
  identifier: string;
  label: string;
  items: T[];
  option: (t: T) => string;
}>();

const { identifier, label, items, option } = toRefs(props);

const value = defineModel<T[]>();

const suggestions = ref<T[]>([...items.value]);

function filterSuggestions(event: AutoCompleteCompleteEvent) {
  if (event.query === "") {
    suggestions.value = [...items.value];
  } else {
    suggestions.value = items.value.filter((item) => {
      return option.value(item).includes(event.query);
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
      multiple
      :input-id="identifier"
      :suggestions="suggestions"
      :option-label="option"
      class="w-full mt-1"
      @complete="filterSuggestions"
    />
  </div>
</template>

<style scoped>
div :deep(ul) {
  width: 100%;
}
</style>
