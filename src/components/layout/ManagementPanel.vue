<script setup lang="ts">
import Panel from "primevue/panel";
import { toRefs } from "vue";

interface Props {
  header: string;
}

const props = defineProps<Props>();
const { header } = toRefs(props);
</script>

<template>
  <panel :header="header">
    <div class="container">
      <slot name="list" />
      <div class="edit-area">
        <slot name="edit" />
      </div>
    </div>
  </panel>
</template>

<style>
.container {
  display: grid;
  grid-template-columns: 2fr repeat(10, 1fr);
  column-gap: 1rem;
}

.edit-area {
  grid-column: 3 / span 8;
}
</style>
