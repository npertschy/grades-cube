<script setup lang="ts" generic="T">
import PAutoComplete, { type AutoCompleteCompleteEvent } from "primevue/autocomplete";
import { computed, shallowRef, toRefs } from "vue";

const props = defineProps<{
  identifier: string;
  label: string;
  items: T[];
  option: (t: T) => string;
}>();

const { identifier, label, items, option } = toRefs(props);

const value = defineModel<T[]>();

const query = shallowRef("");

const suggestions = computed<T[]>(() => {
  if (query.value === "") {
    return items.value;
  }
  return items.value.filter((item) => option.value(item).includes(query.value));
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
      multiple
      :input-id="identifier"
      :suggestions="suggestions"
      :option-label="option"
      class="w-full mt-1"
      @complete="(event: AutoCompleteCompleteEvent) => query = event.query"
    />
  </div>
</template>

<style scoped>
div :deep(ul) {
  width: 100%;
}
</style>
