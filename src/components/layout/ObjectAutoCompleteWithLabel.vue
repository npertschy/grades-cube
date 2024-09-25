<script setup lang="ts" generic="T extends { name: string | undefined }">
import AutoComplete, { type AutoCompleteCompleteEvent } from "primevue/autocomplete";
import { type Ref, ref, toRefs } from "vue";

interface Props {
  identifier: string;
  label: string;
  items: T[];
  option: (t: T) => string;
}

const props = defineProps<Props>();

const { identifier, label, items, option } = toRefs(props);

const value = defineModel<T>();

const suggestions = ref([...items.value]) as Ref<T[]>;

function filterSuggestions(event: AutoCompleteCompleteEvent) {
  if (event.query === "") {
    suggestions.value = [...items.value];
  } else {
    suggestions.value = items.value.filter((item) => {
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
    <auto-complete
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
