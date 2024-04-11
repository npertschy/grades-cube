<script setup lang="ts" generic="T extends { id: number | undefined }">
import Button from "primevue/button";
import { computed, toRefs } from "vue";

interface Props {
  showDeleteWhenDefined: T | undefined;
  saveAction: () => void;
  deleteAction: () => void;
}

const props = defineProps<Props>();

const { showDeleteWhenDefined, saveAction, deleteAction } = toRefs(props);

const showDeleteButton = computed(() => {
  return showDeleteWhenDefined.value?.id > 0;
});
</script>

<template>
  <Button
    label="Speichern"
    @click="saveAction"
  />
  <Button
    v-show="showDeleteButton"
    label="Löschen"
    class="delete-button"
    @click="deleteAction"
  />
</template>

<style scoped>
.delete-button {
  grid-column: 8 / span 1;
}
</style>
