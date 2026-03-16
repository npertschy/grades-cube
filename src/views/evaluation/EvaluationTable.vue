<script setup lang="ts">
import { useEvaluations } from "@/views/evaluation/EvaluationStore";
import { ref, toRefs } from "vue";
import PDataTable, { type DataTableCellEditCompleteEvent } from "primevue/datatable";
import PColumn from "primevue/column";
import PInputText from "primevue/inputtext";
import type { TreeNode } from "primevue/treenode";
import type { EvaluatedStudent, Grade } from "@/components/evaluations/EvaluatedStudent";
import type { Performance } from "@/components/evaluations/Performance";

interface Props {
  selectedNode: TreeNode;
  performances: Performance[];
  students: EvaluatedStudent[];
}

const props = defineProps<Props>();

const { performances, students } = toRefs(props);

const possibleOralGrades = ["++", "+", "0", "-", "--", "f"];

const { updateGrade } = useEvaluations();
const emit = defineEmits<{
  (e: "selected-column", value?: number): void;
}>();

const selectedColumn = ref<number>();

function backgroundColorByType(type: number) {
  switch (type) {
    case 0:
    case 1:
    case 2:
      return { backgroundColor: "lightskyblue" };
    case 3:
    case 4:
      return { backgroundColor: "lightgreen" };
    case 6:
    case 7:
      return { backgroundColor: "lightcoral" };
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
  const grade: Grade = event.newData.grades.get(performanceId);
  await updateGrade(grade);

  if (grade.performanceType === 0) {
    const student = students.value[event.index];
    const oralGradesOfStudent = filterGradesByPerformanceType(student.grades, 0);
    const gradesFrequency = oralGradesOfStudent.reduce(
      (acc, grade) => {
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const sum = Object.entries(gradesFrequency).reduce((acc, [grade, count]) => {
      const gradeIndex = possibleOralGrades.indexOf(grade);
      return acc + (gradeIndex + 1) * count; // zero base index
    }, 0);

    const indexOfRecommendation = sum / oralGradesOfStudent.length;

    const recommendationPerformance = performances.value.find((performance) => performance.type === 1);
    if (recommendationPerformance && recommendationPerformance.performanceId) {
      const recommendationGrade = student.grades.get(recommendationPerformance.performanceId);
      if (recommendationGrade) {
        recommendationGrade.value = possibleOralGrades[Math.round(indexOfRecommendation - 1)];
        await updateGrade(recommendationGrade);
      }
    }
  } else if (grade.performanceType === 3) {
    const student = students.value[event.index];

    await updateOverallGradeByPerformanceType(student, 3, 4);
  } else if (grade.performanceType === 6) {
    const student = students.value[event.index];

    await updateOverallGradeByPerformanceType(student, 6, 7);
  }
}

function filterGradesByPerformanceType(grades: Map<string, Grade>, performanceType: number) {
  return Array.from(grades)
    .map(([, value]) => value)
    .filter((value) => value.performanceType === performanceType)
    .filter((value) => value.value !== undefined)
    .filter((value) => value.value !== null)
    .filter((value) => value.value !== "")
    .map((value) => value.value)
    .filter((value) => value !== "f");
}

function calculateAverageGrade(grades: Map<string, Grade>, performanceType: number) {
  const filteredGrades = filterGradesByPerformanceType(grades, performanceType);
  const sum = filteredGrades.reduce((acc, grade) => acc + parseInt(grade), 0);
  return sum / filteredGrades.length;
}

async function updateOverallGradeByPerformanceType(
  student: EvaluatedStudent,
  performanceType: number,
  overallPerformanceType: number,
) {
  const average = calculateAverageGrade(student.grades, performanceType);

  const overallPerformance = performances.value.find((performance) => performance.type === overallPerformanceType);
  if (overallPerformance && overallPerformance.performanceId) {
    const overallGrade = student.grades.get(overallPerformance.performanceId);
    if (overallGrade) {
      overallGrade.value = Math.floor(average).toString();
      await updateGrade(overallGrade);
    }
  }
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
          {{ data.grades.get(column.props.field)?.value }}
        </span>
      </template>
      <template
        v-if="performance.editable"
        #editor="{ data, column }"
      >
        <p-input-text
          v-model="data.grades.get(column.props.field).value"
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
