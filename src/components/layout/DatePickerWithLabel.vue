<script setup lang="ts">
import PDatePicker from "primevue/datepicker";
import PMessage from "primevue/message";

const value = defineModel<Date>();

const { label, validationErrorMessage } = defineProps<{
  label: string;
  validationErrorMessage?: string;
}>();

const inputId = label.replace(/\s/g, "") + "Field";
</script>

<template>
  <div>
    <label
      :for="inputId"
      class="font-semibold"
    >
      {{ label }}
    </label>
    <p-date-picker
      v-model="value"
      :input-id="inputId"
      class="calender-input"
      date-format="dd.mm.yy"
      show-icon
      icon-display="input"
      show-button-bar
      :invalid="validationErrorMessage != undefined"
    />
    <p-message
      v-if="validationErrorMessage"
      severity="error"
      variant="simple"
      size="small"
    >
      {{ validationErrorMessage }}
    </p-message>
  </div>
</template>

<style scoped>
.calender-input {
  width: 100%;
  margin-top: 0.5rem;
}
</style>
