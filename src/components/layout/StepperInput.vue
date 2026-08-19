<script setup lang="ts">
import PInputNumber from "primevue/inputnumber";
import { watch } from "vue";

const value = defineModel<number>();

const props = defineProps<{
  icon: string;
}>();

const emit = defineEmits<{
  (e: "at-input-change", value: number): void;
}>();

watch(value, (newValue) => {
  if (newValue !== undefined) emit("at-input-change", newValue);
});
</script>

<template>
  <p-input-number
    v-model="value"
    show-buttons
    button-layout="vertical"
    :min="0"
    :max="1"
    :step="0.01"
    :min-fraction-digits="0"
    :max-fraction-digits="2"
  >
    <template #incrementicon>
      <span class="pi pi-angle-up" />
      <span :class="icon" />
    </template>
    <template #decrementicon>
      <span class="pi pi-angle-down" />
      <span :class="icon" />
    </template>
  </p-input-number>
</template>
