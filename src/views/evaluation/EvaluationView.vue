<script setup lang="ts">
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import { useEvaluations } from "@/views/evaluation/EvaluationStore";
import { onMounted, ref, watch } from "vue";
import PTree, { type TreeExpandedKeys, type TreeSelectionKeys } from "primevue/tree";
import PPanel from "primevue/panel";
import type { TreeNode } from "primevue/treenode";
import type { EvaluatedStudent } from "@/components/evaluations/EvaluatedStudent";
import type { Performance } from "@/components/evaluations/Performance";
import EvaluationTable from "./EvaluationTable.vue";
import HistogramPanel from "./HistogramPanel.vue";

const { selectedSchoolYear, selectedSemester } = useSchoolYearSelection();
const { treeItems, loadTreeItems, loadStudentsForCourse, loadStudentsForGroup, loadPerformancesForCourse } =
  useEvaluations();

const expandedKeys: TreeExpandedKeys = ref({});
const selectedItem: TreeSelectionKeys = ref();
const students = ref<EvaluatedStudent[]>([]);
const performances = ref<Performance[]>([]);
const selectedNode = ref<TreeNode>();

const selectedColumn = ref<number>();
const showChartForPerformance = ref(false);

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

async function reloadCourse() {
  students.value = await loadStudentsForCourse(selectedNode.value?.data);
  performances.value = await loadPerformancesForCourse(selectedNode.value?.data);
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
    <evaluation-table
      v-if="selectedNode"
      class="table-area"
      :selected-node="selectedNode"
      :performances="performances"
      :students="students"
      @performances-updated="reloadCourse"
    />
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
</style>
