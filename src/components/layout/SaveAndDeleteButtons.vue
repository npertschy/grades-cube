<script setup lang="ts" generic="T extends { id: number | undefined }">
import PButton from "primevue/button";
import { computed } from "vue";

const {
  showDeleteWhenDefined,
  saveAction,
  deleteAction,
  gridColumns = 8,
} = defineProps<{
  showDeleteWhenDefined: T | undefined;
  saveAction: () => void;
  deleteAction: () => void;
  gridColumns?: number;
}>();

const showDeleteButton = computed(() => {
  return showDeleteWhenDefined && showDeleteWhenDefined.id && showDeleteWhenDefined.id > 0;
});

const buttonSpan = computed(() => {
  return Math.ceil(gridColumns / 8);
});

const deleteButtonStart = computed(() => {
  return gridColumns - buttonSpan.value + 1;
});
</script>

<template>
  <div class="button-container mt-2">
    <p-button
      label="Speichern"
      class="save-button"
      outlined
      severity="success"
      @click="saveAction"
    />
    <p-button
      v-show="showDeleteButton"
      label="Löschen"
      class="delete-button"
      outlined
      severity="danger"
      @click="deleteAction"
    />
  </div>
</template>

<style scoped>
.button-container {
  display: grid;
  grid-template-columns: repeat(v-bind(gridColumns), 1fr);
}

.save-button {
  grid-column: 1 / span v-bind(buttonSpan);
}

.delete-button {
  grid-column: v-bind(deleteButtonStart) / span v-bind(buttonSpan);
}
</style>
