<script setup lang="ts">
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import { useEvaluations } from "@/views/evaluation/EvaluationStore";
import { computed, onMounted, ref, watch } from "vue";
import PTree, { type TreeExpandedKeys, type TreeSelectionKeys } from "primevue/tree";
import PPanel from "primevue/panel";
import PDataTable, { type DataTableCellEditCompleteEvent } from "primevue/datatable";
import PColumn from "primevue/column";
import PInputText from "primevue/inputtext";
import PButton from "primevue/button";
import PDialog from "primevue/dialog";
import PDrawer from "primevue/drawer";
import PChart from "primevue/chart";
import ChartDataLabels from "chartjs-plugin-datalabels";
import type { TreeNode } from "primevue/treenode";
import type { EvaluatedStudent, Grade } from "@/components/evaluations/EvaluatedStudent";
import type { Performance } from "@/components/evaluations/Performance";
import GradeWeightsView from "@/views/evaluation/GradeWeightsView.vue";

const possibleOralGrades = ["++", "+", "0", "-", "--", "f"];

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

const typeOfNewPerformance = ref<number>(-1);
const openAddPerformanceDialog = ref(false);
const titleOfPerformance = ref("");

const selectedColumn = ref<number>();
const showChartForPerformance = ref(false);
const showWeightsManagement = ref(false);

onMounted(async () => {
  await loadTreeItems(selectedSchoolYear.value!, selectedSemester.value!);

  treeItems.value.forEach((item) => {
    expandedKeys.value[item.key] = true;
  });
});

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
      students.value = await loadStudentsForCourse(node.data);
      performances.value = await loadPerformancesForCourse(node.data);
    }
  } else {
    students.value = [];
    performances.value = [];
  }
});

const tableTitle = computed(() => {
  if (selectedNode.value) {
    return selectedNode.value?.type === "group"
      ? selectedNode.value.data.name
      : `${selectedNode.value?.data.group.name} ${selectedNode.value?.data.subject.name}`;
  } else {
    return "";
  }
});

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
  students.value = await loadStudentsForCourse(selectedNode.value?.data);
  performances.value = await loadPerformancesForCourse(selectedNode.value?.data);
}

function handleColumnSelection(id: number) {
  if (selectedColumn.value === id) {
    selectedColumn.value = undefined;
  } else {
    selectedColumn.value = id;
  }
}

const titleOfGradeChart = computed(() => {
  if (selectedColumn.value) {
    const name = performances.value.find((performance) => performance.id === selectedColumn.value)?.title;

    return `Notenübersicht für ${name}`;
  } else {
    return "Klicken Sie auf eine Leistung, um die Notenübersicht zu sehen.";
  }
});

const chartData = computed(() => {
  if (selectedColumn.value) {
    const performance = performances.value.find((performance) => performance.id === selectedColumn.value);
    if (performance) {
      const labels =
        performance.type === 0
          ? ["++", "+", "0", "-", "--", "f"]
          : Array.from({ length: 16 }, (_, i) => i.toString()).reverse();
      const grades = students.value
        .map((student) => student.grades.get(performance.performanceId!)?.value)
        .filter((grade) => grade !== undefined)
        .filter((grade) => grade !== null)
        .filter((grade) => grade != "") as string[];
      const histogram: number[] = [];
      labels.forEach((label) => {
        histogram.push(grades.filter((grade) => grade === label).length);
      });

      const average = grades.reduce((acc, grade) => acc + parseInt(grade), 0) / grades.length;

      let label = `Notenverteilung für ${performance.title} und ${grades.length} bewertete Schüler`;

      if (performance.type > 0) {
        label += ` - (Durchschnitt: ${average.toFixed(2)})`;
      }

      return {
        labels,
        datasets: [
          {
            label: label,
            data: histogram,
            borderColor: "rgba(8, 145, 178, 0.5)",
            backgroundColor: "rgba(236, 254, 255, 1)",
            borderWidth: 2,
          },
        ],
      };
    }
  }

  return {};
});

async function handleGradeChanged(event: DataTableCellEditCompleteEvent) {
  const performanceId = event.field;
  const grade: Grade = event.newData.grades.get(performanceId);
  await updateGrade(grade);

  if (grade.performanceType === 0) {
    const student = students.value[event.index];
    const oralGradesOfStudent = Array.from(student.grades)
      .map(([, value]) => value)
      .filter((value) => value.performanceType === 0)
      .filter((value) => value.value !== undefined)
      .filter((value) => value.value !== null)
      .filter((value) => value.value !== "")
      .map((value) => value.value)
      .filter((value) => value !== "f");
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
    const specialGradesOfStudent = Array.from(student.grades)
      .map(([, value]) => value)
      .filter((value) => value.performanceType === 3)
      .filter((value) => value.value !== undefined)
      .filter((value) => value.value !== null)
      .filter((value) => value.value !== "")
      .filter((value) => value.value !== "f")
      .map((value) => value.value);

    const sum = specialGradesOfStudent.reduce((acc, grade) => acc + parseInt(grade), 0);
    const average = sum / specialGradesOfStudent.length;

    const specialOverallPerformance = performances.value.find((performance) => performance.type === 4);
    if (specialOverallPerformance && specialOverallPerformance.performanceId) {
      const specialOverallGrade = student.grades.get(specialOverallPerformance.performanceId);
      if (specialOverallGrade) {
        specialOverallGrade.value = Math.floor(average).toString();
        await updateGrade(specialOverallGrade);
      }
    }
  } else if (grade.performanceType === 6) {
    const student = students.value[event.index];
    const testGradesOfStudent = Array.from(student.grades)
      .map(([, value]) => value)
      .filter((value) => value.performanceType === 6)
      .filter((value) => value.value !== undefined)
      .filter((value) => value.value !== null)
      .filter((value) => value.value !== "")
      .filter((value) => value.value !== "f")
      .map((value) => value.value);

    const sum = testGradesOfStudent.reduce((acc, grade) => acc + parseInt(grade), 0);
    const average = sum / testGradesOfStudent.length;

    const testOverallPerformance = performances.value.find((performance) => performance.type === 7);
    if (testOverallPerformance && testOverallPerformance.performanceId) {
      const testOverallGrade = student.grades.get(testOverallPerformance.performanceId);
      if (testOverallGrade) {
        testOverallGrade.value = Math.floor(average).toString();
        await updateGrade(testOverallGrade);
      }
    }
  }
}

function allowedGradesByPerformance(performance: Performance) {
  if (performance.type === 0) {
    return { pattern: /^(?:\+\+|\+|0|-|--|f)$/, validateOnly: true };
  } else {
    return { pattern: /^(?:[\d]|1[0-5])$/, validateOnly: true };
  }
}
</script>

<template>
  <div class="container">
    <p-panel
      header="Kurse"
      :pt="{ content: 'no-padding' }"
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
    <div
      v-if="selectedNode"
      class="table-area"
    >
      <div
        style="display: grid; transition: 300ms"
        :style="[
          {
            'grid-template-columns': showWeightsManagement ? '10fr 350px' : '10fr 0px',
            'column-gap': showWeightsManagement ? '1rem' : '0',
          },
        ]"
      >
        <p-data-table
          :value="students"
          size="small"
          show-gridlines
          scrollable
          scroll-height="80vh"
          row-hover
          edit-mode="cell"
          @cell-edit-complete="handleGradeChanged"
        >
          <template #header>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; align-items: center">
              <h2>{{ tableTitle }}</h2>
              <div>
                <p-button
                  severity="secondary"
                  class="new-oral-performance"
                  style="color: lightskyblue"
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
                  style="color: lightgreen"
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
                  style="color: lightcoral"
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
              <div>
                <p-button
                  icon="pi pi-chart-bar"
                  severity="secondary"
                  :style="
                    showChartForPerformance
                      ? { 'background-color': 'var(--p-highlight-focus-background)', color: 'var(--p-highlight-color)' }
                      : {}
                  "
                  @click="showChartForPerformance = !showChartForPerformance"
                />
                <p-button
                  icon="pi pi-percentage"
                  severity="secondary"
                  :style="
                    showWeightsManagement
                      ? { 'background-color': 'var(--p-highlight-focus-background)', color: 'var(--p-highlight-color)' }
                      : {}
                  "
                  @click="showWeightsManagement = !showWeightsManagement"
                />
              </div>
            </div>
          </template>
          <p-column
            header="#"
            frozen
            style="width: 2rem"
          >
            <template #body="headerProps">
              {{ headerProps.index + 1 }}
            </template>
          </p-column>
          <p-column
            header="Name"
            frozen
            style="width: 14rem"
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
            style="width: fit-content; min-width: 15px; max-width: 30px"
          >
            <template #header>
              <span
                style="cursor: pointer"
                :style="[selectedColumn === performance.id ? { 'font-weight': 'bold' } : { 'font-weight': 600 }]"
                @click="handleColumnSelection(performance.id!)"
              >
                {{ performance.title }}
              </span>
            </template>
            <template #body="{ data, column }">
              <span :style="[selectedColumn === performance.id ? { 'font-weight': 'bold' } : {}]">
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
        <grade-weights-view
          v-if="showWeightsManagement"
          :performances="performances"
        />
      </div>
    </div>
    <div
      v-else
      class="table-area"
      style="display: grid; place-items: center"
    >
      <h3>Bitte wählen Sie eine Klasse oder einen Kurs aus.</h3>
    </div>
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
    <p-drawer
      v-model:visible="showChartForPerformance"
      position="bottom"
      :header="titleOfGradeChart"
      :modal="false"
      :dismissable="false"
      :show-close-icon="false"
      style="height: 35%"
    >
      <p-chart
        type="bar"
        :data="chartData"
        :plugins="[ChartDataLabels]"
        :options="{
          maintainAspectRatio: false,
          scales: { y: { ticks: { stepSize: 1 } } },
        }"
        style="height: 100%"
      />
    </p-drawer>
  </div>
</template>

<style>
td:has(input) {
  padding: 0px 8px !important;
}
</style>
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
  background-color: lightskyblue;
  border-color: lightskyblue;
  color: white !important;
}

.new-special-performance:hover {
  background-color: lightgreen;
  border-color: lightgreen;
  color: white !important;
}

.new-test-performance:hover {
  background-color: lightcoral;
  border-color: lightcoral;
  color: white !important;
}
</style>
