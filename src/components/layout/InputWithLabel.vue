<script setup lang="ts">
import InputText from "primevue/inputtext";
import { toRefs } from "vue";

interface Props {
  identifier: string;
  label: string;
}

const props = defineProps<Props>();

const { identifier, label } = toRefs(props);

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
    <input-text
      v-model="value"
      :input-id="identifier"
      class="w-full mt-1"
    />
  </div>
</template>
