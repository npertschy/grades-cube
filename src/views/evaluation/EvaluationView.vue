<script setup lang="ts">
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import { useEvaluations } from "@/views/evaluation/EvaluationStore";
import { useGradeCalculation } from "@/components/evaluations/GradeCalculation";
import { computed, onMounted, ref, watch } from "vue";
import PTree, { type TreeExpandedKeys, type TreeSelectionKeys } from "primevue/tree";
import PPanel from "primevue/panel";
import PButton from "primevue/button";
import PDialog from "primevue/dialog";
import PInputText from "primevue/inputtext";
import type { TreeNode } from "primevue/treenode";
import type { EvaluatedStudent, Grade } from "@/components/evaluations/EvaluatedStudent";
import { PerformanceType, type Performance } from "@/components/evaluations/Performance";
import EvaluationTable from "./EvaluationTable.vue";
import GradeWeightsView from "./GradeWeightsView.vue";
import TestGradeCalculator from "./TestGradeCalculator.vue";
import HistogramPanel from "./HistogramPanel.vue";
import { useUiErrorHandling } from "@/components/errors/ErrorHandling";
import { useCourses } from "@/components/courses/CourseStore";

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
  deletePerformance,
} = useEvaluations();

const { computeOralSuggestion, computeWeightedOverall, computeATOverall, computeFinalOverall } = useGradeCalculation();

const { formatCourse } = useCourses();

const expandedKeys: TreeExpandedKeys = ref({});
const selectedItem: TreeSelectionKeys = ref();
const students = ref<EvaluatedStudent[]>([]);
const performances = ref<Performance[]>([]);
const selectedNode = ref<TreeNode>();

const selectedColumn = ref<number>();

const typeOfNewPerformance = ref<PerformanceType>();
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
      : formatCourse(selectedNode.value.data);
  } else {
    return "";
  }
});

watch([selectedColumn, typeOfNewPerformance], () => {
  if (!selectedColumn.value && typeOfNewPerformance.value == PerformanceType.ORAL) {
    const formattedDate = new Date().toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    });

    titleOfPerformance.value = formattedDate;
  } else {
    titleOfPerformance.value = "";
  }
});

const addPerformanceTitle = computed(() => {
  if (selectedColumn.value) {
    return "Leistung bearbeiten";
  }

  switch (typeOfNewPerformance.value) {
    case PerformanceType.ORAL:
      return "Neue mündliche Leistung anlegen";
    case PerformanceType.SPECIAL:
      return "Neue spezielle Leistung anlegen";
    case PerformanceType.WRITTEN:
      return "Neue schriftliche Leistung anlegen";
    default:
      return "";
  }
});

const { runSafeWithToast, confirmAction } = useUiErrorHandling();

async function handleSavePerformance() {
  const successMessage = selectedColumn.value ? "Leistung erfolgreich bearbeitet" : "Leistung erfolgreich angelegt";
  await runSafeWithToast(async () => {
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
        type: typeOfNewPerformance.value!,
        editable: true,
        sortOrder: existingPerformances.length,
        date: new Date(),
        courseId: selectedNode.value?.data.id,
        id: undefined,
        performanceId: undefined,
        weight: 0,
      };
      await createPerformance(performance, students.value);
      showWeightsManagement.value = typeOfNewPerformance.value !== PerformanceType.ORAL;
    }
    openAddPerformanceDialog.value = false;
    titleOfPerformance.value = "";
    typeOfNewPerformance.value = undefined;
    await reloadCourse();
  }, successMessage);
}

async function handleDeletePerformance() {
  if (!selectedColumn.value) return;
  const performance = performances.value.find((p) => p.id === selectedColumn.value);
  if (!performance) return;
  confirmAction(
    "Leistung löschen",
    `Soll die Leistung ${performance?.title} wirklich gelöscht werden? Alle zugehörigen Noten werden ebenfalls gelöscht.`,
    `Leistung ${performance?.title} erfolgreich gelöscht`,
    async () => {
      await deletePerformance(performance);
      selectedColumn.value = undefined;
      await reloadCourse();
      showWeightsManagement.value = performance.type !== PerformanceType.ORAL;
    },
  );
}

async function handleUpdatePerformances(updatedPerformances: Performance[]) {
  await runSafeWithToast(async () => {
    await Promise.all(updatedPerformances.map((p) => updatePerformance(p)));

    performances.value = await loadPerformancesForCourse(selectedNode.value?.data);

    const type = updatedPerformances[0].type;
    await Promise.all(students.value.map((student) => cascadeGradeChanges(student, type)));
  }, "Leistungen erfolgreich aktualisiert");
}

async function handleGradeChanged(grade: Grade, studentIndex: number) {
  await runSafeWithToast(async () => {
    await updateGrade(grade);
    const student = students.value[studentIndex];
    const performanceType = grade.performanceType;

    await cascadeGradeChanges(student, performanceType);
  }, "Note erfolgreich aktualisiert");
}

async function cascadeGradeChanges(student: EvaluatedStudent, performanceType: PerformanceType) {
  if (performanceType === PerformanceType.ORAL) {
    await computeOralSuggestion(student, performances.value, updateGrade);
  } else if (performanceType === PerformanceType.ORAL_OVERALL || performanceType === PerformanceType.SPECIAL_OVERALL) {
    await computeATOverall(student, performances.value, updateGrade);
    await computeFinalOverall(student, performances.value, updateGrade);
  } else if (performanceType === PerformanceType.SPECIAL) {
    await computeWeightedOverall(
      student,
      performances.value,
      PerformanceType.SPECIAL,
      PerformanceType.SPECIAL_OVERALL,
      updateGrade,
    );
    await computeATOverall(student, performances.value, updateGrade);
    await computeFinalOverall(student, performances.value, updateGrade);
  } else if (performanceType === PerformanceType.WRITTEN) {
    await computeWeightedOverall(
      student,
      performances.value,
      PerformanceType.WRITTEN,
      PerformanceType.WRITTEN_OVERALL,
      updateGrade,
    );
    await computeFinalOverall(student, performances.value, updateGrade);
  } else if (performanceType === PerformanceType.AT_OVERALL || performanceType === PerformanceType.WRITTEN_OVERALL) {
    await computeFinalOverall(student, performances.value, updateGrade);
  }
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

const hideWeightsManagementDisabled = ref(false);
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
            v-tooltip.bottom="'Neue mündliche Leistung anlegen'"
            severity="secondary"
            class="new-oral-performance"
            style="color: var(--p-performance-oral-text)"
            @click="
              typeOfNewPerformance = PerformanceType.ORAL;
              openAddPerformanceDialog = true;
            "
          >
            <i class="pi pi-plus" />
            <i class="pi pi-comment" />
          </p-button>
          <p-button
            v-tooltip.bottom="'Neue besondere Leistung anlegen'"
            severity="secondary"
            class="new-special-performance"
            style="color: var(--p-performance-special-text)"
            @click="
              typeOfNewPerformance = PerformanceType.SPECIAL;
              openAddPerformanceDialog = true;
            "
          >
            <i class="pi pi-plus" />
            <i class="pi pi-star" />
          </p-button>
          <p-button
            v-tooltip.bottom="'Neue schriftliche Leistung anlegen'"
            severity="secondary"
            class="new-test-performance"
            style="color: var(--p-performance-test-text)"
            @click="
              typeOfNewPerformance = PerformanceType.WRITTEN;
              openAddPerformanceDialog = true;
            "
          >
            <i class="pi pi-plus" />
            <i class="pi pi-file" />
          </p-button>
        </div>
        <div>
          <p-button
            v-tooltip.bottom="'Leistung bearbeiten'"
            icon="pi pi-pencil"
            severity="secondary"
            :disabled="selectedColumn === undefined"
            @click="
              titleOfPerformance = performances.find((performance) => performance.id === selectedColumn)?.title!;
              openAddPerformanceDialog = true;
            "
          />
          <p-button
            v-tooltip.bottom="'Leistung löschen'"
            icon="pi pi-trash"
            severity="secondary"
            :disabled="selectedColumn === undefined"
            @click="handleDeletePerformance"
          />
        </div>
      </template>
      <template #icons>
        <p-button
          v-tooltip.bottom="'Notenspiegel'"
          icon="pi pi-chart-bar"
          severity="secondary"
          :style="showChartForPerformanceButtonStyle"
          @click="showChartForPerformance = !showChartForPerformance"
        />
        <p-button
          v-tooltip.bottom="'Gewichtungen verwalten'"
          icon="pi pi-percentage"
          severity="secondary"
          :style="showWeightsManagementButtonStyle"
          :disabled="showWeightsManagement && hideWeightsManagementDisabled"
          @click="
            showWeightsManagement = !showWeightsManagement;
            if (showWeightsManagement) showCalculator = false;
          "
        />
        <p-button
          v-tooltip.bottom="'Testnotenrechner'"
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
          @update-performances="handleUpdatePerformances"
          @on-invalid-weights="(invalid) => (hideWeightsManagementDisabled = invalid)"
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
