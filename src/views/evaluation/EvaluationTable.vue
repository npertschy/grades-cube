<script setup lang="ts">
import { ref } from "vue";
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

function backgroundColorByType(type: number) {
  switch (type) {
    case 0:
    case 1:
    case 2:
      return { backgroundColor: "var(--p-performance-oral-background)" };
    case 3:
    case 4:
      return { backgroundColor: "var(--p-performance-special-background)" };
    case 6:
    case 7:
      return { backgroundColor: "var(--p-performance-test-background)" };
    default:
      return {};
  }
}

function handleColumnSelection(id: number) {
  if (selectedColumn.value === id) {
    selectedColumn.value = undefined;
    // emit deselection
    emit("selected-column", undefined);
  } else {
    selectedColumn.value = id;
    // emit new selected column id
    emit("selected-column", id);
  }
}

async function handleGradeChanged(event: DataTableCellEditCompleteEvent) {
  const performanceId = event.field;
  const grade: Grade = event.newData.grades[performanceId];
  const studentIndex = event.index;
  emit("grade-changed", { grade, studentIndex });
}

const gradePatterns: Record<number, RegExp> = {
  0: /^(?:\+\+|\+|0|-|--|f)$/,
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

function gradeForField(data: EvaluatedStudent, field: string): Grade | undefined {
  return data.grades[field];
}
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
      v-for="performance in performances"
      :key="performance.id"
      :field="performance.performanceId"
      :style="backgroundColorByType(performance.type)"
      style="width: fit-content; min-width: 2rem"
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
      <template #body="{ data, column }">
        <span :class="selectedColumn === performance.id ? 'bold-text' : ''">
          {{ gradeForField(data, column.props.field as string)?.value }}
        </span>
      </template>
      <template
        v-if="performance.editable"
        #editor="{ data, column }"
      >
        <p-input-text
          v-model="gradeForField(data, column.props.field as string)!.value"
          v-keyfilter="allowedGradesByPerformance(performance)"
          style="width: 100%; padding-top: 3px; padding-bottom: 3px"
        />
      </template>
    </p-column>
  </p-data-table>
</template>

<style>
td:has(input) {
  padding: 0px 8px !important;
}

.bold-text {
  font-weight: bold;
}

.normal-text {
  font-weight: 500;
}
</style>
