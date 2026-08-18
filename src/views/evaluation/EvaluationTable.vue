<script setup lang="ts">
import { computed, ref } from "vue";
import PDataTable, { type DataTableCellEditCompleteEvent } from "primevue/datatable";
import PColumn from "primevue/column";
import PInputText from "primevue/inputtext";
import type { TreeNode } from "primevue/treenode";
import type { EvaluatedStudent, Grade } from "@/components/evaluations/EvaluatedStudent";
import type { Performance } from "@/components/evaluations/Performance";

const { performances, students } = defineProps<{
  selectedNode: TreeNode;
  performances: Performance[];
  students: EvaluatedStudent[];
}>();

const emit = defineEmits<{
  (e: "selected-column", value?: number): void;
  (e: "grade-changed", value: { grade: Grade; studentIndex: number }): void;
}>();

const selectedColumn = ref<number>();

function columnStyle(performance: Performance) {
  const charWidth = 0.6;
  const padding = 1.5;
  const width = Math.max(3, Math.min(12, performance.title.length * charWidth + padding));

  const bgColors: Record<number, string> = {
    0: "var(--p-performance-oral-background)",
    1: "var(--p-performance-oral-background)",
    2: "var(--p-performance-oral-background)",
    3: "var(--p-performance-special-background)",
    4: "var(--p-performance-special-background)",
    5: "var(--p-performance-special-background)",
    6: "var(--p-performance-test-background)",
    7: "var(--p-performance-test-background)",
    8: "var(--p-performance-test-background)",
  };

  return {
    width: `${width}rem`,
    minWidth: "2rem",
    maxWidth: "12rem",
    ...(bgColors[performance.type] ? { backgroundColor: bgColors[performance.type] } : {}),
  };
}

function handleColumnSelection(id: number) {
  if (selectedColumn.value === id) {
    selectedColumn.value = undefined;
    emit("selected-column", undefined);
  } else {
    selectedColumn.value = id;
    emit("selected-column", id);
  }
}

async function handleGradeChanged(event: DataTableCellEditCompleteEvent) {
  const colIndex = Number(event.field);
  const grade: Grade = event.newData.grades[colIndex];
  const studentIndex = event.index;
  emit("grade-changed", { grade, studentIndex });
}

const gradePatterns: Record<number, RegExp> = {
  0: /^(?:\+\+|\+|0|-|--|f)$/,
  2: /^(?:[\d]|1[0-5])$/,
  3: /^(?:[\d]|1[0-5])$/,
  6: /^(?:[\d]|1[0-5])$/,
};

function allowedGradesByPerformance(performance: Performance) {
  const pattern = gradePatterns[performance.type];
  return {
    pattern,
    validateOnly: true,
  };
}

const gradeValidation = computed(() =>
  Object.fromEntries(
    performances.map(p => [p.id, allowedGradesByPerformance(p)])
  )
)
</script>

<template>
  <p-data-table
    :value="students"
    size="small"
    show-gridlines
    scrollable
    scroll-height="80vh"
    row-hover
    edit-mode="cell"
    style="overflow-x: scroll"
    :virtual-scroller-options="{ itemSize: 32 }"
    @cell-edit-complete="handleGradeChanged"
  >
    <p-column
      header="#"
      frozen
      style="min-width: 2rem"
    >
      <template #body="headerProps">
        {{ headerProps.index + 1 }}
      </template>
    </p-column>
    <p-column
      header="Name"
      frozen
      style="min-width: 14rem"
    >
      <template #body="slotProps">
        {{ slotProps.data.student.firstName }} {{ slotProps.data.student.lastName }}
      </template>
    </p-column>
    <p-column
      v-for="(performance, colIndex) in performances"
      :key="performance.id"
      :field="`${colIndex}`"
      :style="columnStyle(performance)"
    >
      <template #header>
        <span
          style="cursor: pointer"
          :class="selectedColumn === performance.id ? 'bold-text' : 'normal-text'"
          @click="handleColumnSelection(performance.id!)"
        >
          {{ performance.title }}
        </span>
      </template>
      <template #body="{ data }">
        <span :class="selectedColumn === performance.id ? 'bold-text' : ''">
          {{ (data as EvaluatedStudent).grades[colIndex]?.value }}
        </span>
      </template>
      <template
        v-if="performance.editable"
        #editor="{ data }"
      >
        <p-input-text
          v-model="(data as EvaluatedStudent).grades[colIndex]!.value"
          v-keyfilter="gradeValidation[performance.id!]"
          style="width: 100%; padding-top: 3px; padding-bottom: 3px"
        />
      </template>
    </p-column>
  </p-data-table>
</template>

<style scoped>
td:has(input) {
  padding: 0px 8px !important;
  overflow: hidden;
}

:deep(.p-datatable-tbody > tr > td .p-cell-editor-wrapper) {
  display: block;
  width: 100%;
}

:deep(.p-inputtext) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.bold-text {
  font-weight: bold;
}

.normal-text {
  font-weight: 500;
}
</style>
