<script setup lang="ts">
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import { useEvaluations } from "@/views/evaluation/EvaluationStore";
import { computed, onMounted, ref, watch } from "vue";
import PTree, { type TreeExpandedKeys, type TreeSelectionKeys } from "primevue/tree";
import PPanel from "primevue/panel";
import PButton from "primevue/button";
import PDialog from "primevue/dialog";
import PInputText from "primevue/inputtext";
import type { TreeNode } from "primevue/treenode";
import type { EvaluatedStudent, Grade } from "@/components/evaluations/EvaluatedStudent";
import type { Performance } from "@/components/evaluations/Performance";
import EvaluationTable from "./EvaluationTable.vue";
import GradeWeightsView from "./GradeWeightsView.vue";
import TestGradeCalculator from "./TestGradeCalculator.vue";
import HistogramPanel from "./HistogramPanel.vue";

const { selectedSchoolYear, selectedSemester } = useSchoolYearSelection();
const {
  treeItems,
  loadTreeItems,
  loadStudentsForCourse,
  loadStudentsForGroup,
  loadPerformancesForCourse,
  createPerformance,
  updatePerformance,
  updateGrade,
} = useEvaluations();

const expandedKeys: TreeExpandedKeys = ref({});
const selectedItem: TreeSelectionKeys = ref();
const students = ref<EvaluatedStudent[]>([]);
const performances = ref<Performance[]>([]);
const selectedNode = ref<TreeNode>();

const selectedColumn = ref<number>();

const typeOfNewPerformance = ref<number>(-1);
const openAddPerformanceDialog = ref(false);
const titleOfPerformance = ref("");

const showChartForPerformance = ref(false);
const showWeightsManagement = ref(false);
const showCalculator = ref(false);

onMounted(async () => {
  await populateTree();
});

watch([selectedSchoolYear, selectedSemester], async () => {
  await populateTree();
});

async function populateTree() {
  await loadTreeItems(selectedSchoolYear.value!, selectedSemester.value!);

  treeItems.value.forEach((item) => {
    expandedKeys.value[item.key] = true;
  });

  handleUnselect();
}

function handleGroupOrCourseSelection(node: TreeNode) {
  selectedNode.value = node;
}

function handleUnselect() {
  selectedNode.value = undefined;
  selectedItem.value = undefined;
}

watch(selectedNode, async (node) => {
  if (node) {
    if (node.type === "group") {
      students.value = await loadStudentsForGroup(node.data);
      performances.value = [];
    } else if (node.type === "course") {
      const [studentsForCourse, performancesForCourse] = await Promise.all([
        loadStudentsForCourse(node.data),
        loadPerformancesForCourse(node.data),
      ]);
      students.value = studentsForCourse;
      performances.value = performancesForCourse;
    }
  } else {
    students.value = [];
    performances.value = [];
  }
});

async function reloadCourse() {
  const [studentsForCourse, performancesForCourse] = await Promise.all([
    loadStudentsForCourse(selectedNode.value?.data),
    loadPerformancesForCourse(selectedNode.value?.data),
  ]);
  students.value = studentsForCourse;
  performances.value = performancesForCourse;
}

const tableTitle = computed(() => {
  if (selectedNode.value) {
    return selectedNode.value?.type === "group"
      ? selectedNode.value.data.name
      : `${selectedNode.value?.data.group.name} ${selectedNode.value?.data.subject.name}`;
  } else {
    return "";
  }
});

const addPerformanceTitle = computed(() => {
  if (selectedColumn.value) {
    return "Leistung bearbeiten";
  }

  switch (typeOfNewPerformance.value) {
    case 0:
      return "Neue mündliche Leistung anlegen";
    case 3:
      return "Neue spezielle Leistung anlegen";
    case 6:
      return "Neue schriftliche Leistung anlegen";
    default:
      return "";
  }
});

async function handleSavePerformance() {
  if (selectedColumn.value) {
    const performance = performances.value.find((performance) => performance.id === selectedColumn.value);
    if (performance) {
      performance.title = titleOfPerformance.value;
      await updatePerformance(performance);
    }
    selectedColumn.value = undefined;
  } else {
    const existingPerformances: Performance[] = performances.value.filter(
      (performance) => performance.type === typeOfNewPerformance.value,
    );
    const performance: Performance = {
      title: titleOfPerformance.value,
      type: typeOfNewPerformance.value,
      editable: true,
      sortOrder: existingPerformances.length,
      date: new Date(),
      courseId: selectedNode.value?.data.id,
      id: undefined,
      performanceId: undefined,
      weight: 0,
    };
    await createPerformance(performance, existingPerformances, students.value);
  }
  openAddPerformanceDialog.value = false;
  titleOfPerformance.value = "";
  typeOfNewPerformance.value = -1;
  reloadCourse();
}

/**
 * Handlers for events emitted by GradeWeightsView
 * - handleUpdatePerformance: persists a single updated performance and updates local state
 * - handleBulkUpdatePerformances: persists multiple updates and merges them into local state
 *
 * These functions keep the local `performances` array in sync and delegate persistence to the store.
 */
async function handleUpdatePerformance(updatedPerformance: Performance) {
  // Persist the change via the store
  await updatePerformance(updatedPerformance);

  // Merge the update into local performances array
  const idx = performances.value.findIndex((p) => p.id === updatedPerformance.id);
  if (idx >= 0) {
    performances.value[idx] = { ...performances.value[idx], ...updatedPerformance };
  } else {
    // If it's a new item (no id match), append it
    performances.value.push(updatedPerformance);
  }
}

async function handleBulkUpdatePerformances(updatedPerformances: Performance[]) {
  // Persist all updates in parallel
  await Promise.all(updatedPerformances.map((p) => updatePerformance(p)));

  // Merge updates into local array
  updatedPerformances.forEach((updated) => {
    const idx = performances.value.findIndex((p) => p.id === updated.id);
    if (idx >= 0) {
      performances.value[idx] = { ...performances.value[idx], ...updated };
    } else {
      performances.value.push(updated);
    }
  });
}

const possibleOralGrades = ["++", "+", "0", "-", "--", "f"];

async function handleGradeChanged(grade: Grade, studentIndex: number) {
  await updateGrade(grade);

  if (grade.performanceType === 0) {
    const student = students.value[studentIndex];
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
      return acc + (gradeIndex + 1) * count;
    }, 0);

    const indexOfRecommendation = sum / oralGradesOfStudent.length;

    const recommendationPerformanceIndex = performances.value.findIndex((performance) => performance.type === 1);
    if (recommendationPerformanceIndex >= 0) {
      const recommendationGrade = student.grades[recommendationPerformanceIndex];
      if (recommendationGrade) {
        recommendationGrade.value = possibleOralGrades[Math.round(indexOfRecommendation - 1)];
        await updateGrade(recommendationGrade);
      }
    }
  } else if (grade.performanceType === 3) {
    const student = students.value[studentIndex];

    await updateOverallGradeByPerformanceType(student, 3, 4);
  } else if (grade.performanceType === 6) {
    const student = students.value[studentIndex];

    await updateOverallGradeByPerformanceType(student, 6, 7);
  }
}

function filterGradesByPerformanceType(grades: Grade[], performanceType: number) {
  return grades
    .filter((grade) => grade.performanceType === performanceType)
    .filter((grade) => grade.value !== undefined)
    .filter((grade) => grade.value !== null)
    .filter((grade) => grade.value !== "")
    .map((grade) => grade.value)
    .filter((value) => value !== "f");
}

async function updateOverallGradeByPerformanceType(
  student: EvaluatedStudent,
  performanceType: number,
  overallPerformanceType: number,
) {
  const average = calculateAverageGrade(student.grades, performanceType);

  const overallPerformanceIndex = performances.value.findIndex((performance) => performance.type === overallPerformanceType);
  if (overallPerformanceIndex >= 0) {
    const overallGrade = student.grades[overallPerformanceIndex];
    if (overallGrade) {
      overallGrade.value = Math.floor(average).toString();
      await updateGrade(overallGrade);
    }
  }
}

function calculateAverageGrade(grades: Grade[], performanceType: number) {
  const filteredGrades = filterGradesByPerformanceType(grades, performanceType);
  const sum = filteredGrades.reduce((acc, grade) => acc + parseInt(grade), 0);
  return sum / filteredGrades.length;
}

function sidePanelButtonStyle(selected: boolean) {
  return {
    backgroundColor: selected ? "var(--p-highlight-focus-background)" : "",
    color: selected ? "var(--p-highlight-color)" : "",
  };
}

const showChartForPerformanceButtonStyle = computed(() => sidePanelButtonStyle(showChartForPerformance.value));
const showWeightsManagementButtonStyle = computed(() => sidePanelButtonStyle(showWeightsManagement.value));
const showCalculatorButtonStyle = computed(() => sidePanelButtonStyle(showCalculator.value));
</script>

<template>
  <div class="container">
    <p-panel
      header="Kurse"
      :pt="{ content: { style: 'padding: 0px' } }"
    >
      <p-tree
        v-model:expanded-keys="expandedKeys"
        v-model:selection-keys="selectedItem"
        :value="treeItems"
        selection-mode="single"
        class="no-padding"
        @node-select="handleGroupOrCourseSelection"
        @node-unselect="handleUnselect"
      />
    </p-panel>
    <p-panel
      v-if="selectedNode"
      class="table-area"
      :pt="{ header: { style: 'padding-block: 0px' }, content: { style: 'padding: 0px' } }"
    >
      <template #header>
        <h3>{{ tableTitle }}</h3>
        <div>
          <p-button
            severity="secondary"
            class="new-oral-performance"
            style="color: var(--p-performance-oral-text)"
            @click="
              typeOfNewPerformance = 0;
              openAddPerformanceDialog = true;
            "
          >
            <i class="pi pi-plus" />
            <i class="pi pi-comment" />
          </p-button>
          <p-button
            severity="secondary"
            class="new-special-performance"
            style="color: var(--p-performance-special-text)"
            @click="
              typeOfNewPerformance = 3;
              openAddPerformanceDialog = true;
            "
          >
            <i class="pi pi-plus" />
            <i class="pi pi-star" />
          </p-button>
          <p-button
            severity="secondary"
            class="new-test-performance"
            style="color: var(--p-performance-test-text)"
            @click="
              typeOfNewPerformance = 6;
              openAddPerformanceDialog = true;
            "
          >
            <i class="pi pi-plus" />
            <i class="pi pi-file" />
          </p-button>
        </div>
        <p-button
          icon="pi pi-pencil"
          severity="secondary"
          :disabled="selectedColumn === undefined"
          @click="
            titleOfPerformance = performances.find((performance) => performance.id === selectedColumn)?.title!;
            openAddPerformanceDialog = true;
          "
        />
      </template>
      <template #icons>
        <p-button
          icon="pi pi-chart-bar"
          severity="secondary"
          :style="showChartForPerformanceButtonStyle"
          @click="showChartForPerformance = !showChartForPerformance"
        />
        <p-button
          icon="pi pi-percentage"
          severity="secondary"
          :style="showWeightsManagementButtonStyle"
          @click="
            showWeightsManagement = !showWeightsManagement;
            if (showWeightsManagement) showCalculator = false;
          "
        />
        <p-button
          icon="pi pi-calculator"
          severity="secondary"
          :style="showCalculatorButtonStyle"
          @click="
            showCalculator = !showCalculator;
            if (showCalculator) showWeightsManagement = false;
          "
        />
      </template>
      <div
        style="display: grid; transition: 300ms"
        :style="[
          {
            'grid-template-columns': showWeightsManagement || showCalculator ? '10fr 350px' : '10fr 0px',
            'column-gap': showWeightsManagement || showCalculator ? '1rem' : '0',
          },
        ]"
      >
        <evaluation-table
          :selected-node="selectedNode"
          :performances="performances"
          :students="students"
          @performances-updated="reloadCourse"
          @selected-column="(id) => (selectedColumn = id)"
          @grade-changed="({ grade, studentIndex }) => handleGradeChanged(grade, studentIndex)"
        />
        <grade-weights-view
          v-if="showWeightsManagement"
          :performances="performances"
          @update-performance="handleUpdatePerformance"
          @update-performances="handleBulkUpdatePerformances"
        />
        <test-grade-calculator v-if="showCalculator" />
      </div>
    </p-panel>
    <div
      v-else
      class="table-area"
      style="display: grid; place-items: center"
    >
      <h3>Bitte wählen Sie eine Klasse oder einen Kurs aus.</h3>
    </div>
    <histogram-panel
      :show-chart-for-performance="showChartForPerformance"
      :selected-column="selectedColumn"
      :performances="performances"
      :students="students"
    />
    <p-dialog
      v-model:visible="openAddPerformanceDialog"
      modal
      :header="addPerformanceTitle"
    >
      <div>
        <label for="performanceTitle">Name: </label>
        <p-input-text
          v-model="titleOfPerformance"
          placeholder="Titel"
        />
      </div>
      <template #footer>
        <p-button
          label="Abbrechen"
          icon="pi pi-times"
          class="p-button-text"
          @click="openAddPerformanceDialog = false"
        />
        <p-button
          label="Speichern"
          icon="pi pi-check"
          @click="handleSavePerformance"
        />
      </template>
    </p-dialog>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-columns: 2fr repeat(10, 1fr);
  column-gap: 1rem;
}

.table-area {
  grid-column: 2 / span 10;
}

.no-padding {
  padding-inline: 0px 0.5rem !important;
  padding-block: 0px 0.5rem !important;
}

.new-oral-performance:hover {
  background-color: var(--p-performance-oral-background);
  border-color: var(--p-performance-oral-border);
  color: var(--p-performance-oral-color) !important;
}

.new-special-performance:hover {
  background-color: var(--p-performance-special-background);
  border-color: var(--p-performance-special-border);
  color: var(--p-performance-special-color) !important;
}

.new-test-performance:hover {
  background-color: var(--p-performance-test-background);
  border-color: var(--p-performance-test-border);
  color: var(--p-performance-test-color) !important;
}
</style>
