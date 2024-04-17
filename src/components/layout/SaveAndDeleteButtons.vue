<script setup lang="ts" generic="T extends { id: number | undefined }">
import PButton from "primevue/button";
import { computed, toRefs } from "vue";

interface Props {
  showDeleteWhenDefined: T | undefined;
  saveAction: () => void;
  deleteAction: () => void;
  gridColumns?: number;
}

const props = withDefaults(defineProps<Props>(), {
  gridColumns: 8,
});

const { showDeleteWhenDefined, saveAction, deleteAction, gridColumns } =
  toRefs(props);

const showDeleteButton = computed(() => {
  return showDeleteWhenDefined.value?.id > 0;
});

const buttonSpan = computed(() => {
  return Math.ceil(gridColumns.value / 8);
});

const deleteButtonStart = computed(() => {
  return gridColumns.value - buttonSpan.value + 1;
});
</script>

<template>
  <div class="button-container mt-2">
    <p-button
      label="Speichern"
      class="save-button"
      @click="saveAction"
    />
    <p-button
      v-show="showDeleteButton"
      label="Löschen"
      class="delete-button"
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
