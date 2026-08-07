<script setup lang="ts">
import PInputText from "primevue/inputtext";

const { identifier, label } = defineProps<{
  identifier: string;
  label: string;
}>();

const value = defineModel<string>();
</script>

<template>
  <div>
    <label
      :for="identifier"
      class="font-semibold"
    >
      {{ label }}
    </label>
    <p-input-text
      v-model="value"
      :id="identifier"
      class="mt-1"
      fluid
    />
  </div>
</template>
