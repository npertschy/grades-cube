<script setup lang="ts">
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import { useEvaluations } from "@/views/evaluation/EvaluationStore";
import { computed, onMounted, ref, watch } from "vue";
import PTree, { type TreeExpandedKeys, type TreeSelectionKeys } from "primevue/tree";
import PPanel from "primevue/panel";
import PDataTable from "primevue/datatable";
import PColumn from "primevue/column";
import PInputText from "primevue/inputtext";
import PSplitButton from "primevue/splitbutton";
import type { TreeNode } from "primevue/treenode";
import type { EvaluatedStudent } from "@/components/evaluations/EvaluatedStudent";
import type { Performance } from "@/components/evaluations/Performance";

const { selectedSchoolYear, selectedSemester } = useSchoolYearSelection();
const { treeItems, loadTreeItems, loadStudentsForCourse, loadStudentsForGroup, loadPerformancesForCourse } =
  useEvaluations();

const expandedKeys: TreeExpandedKeys = ref({});
const selectedItem: TreeSelectionKeys = ref();
const students = ref<EvaluatedStudent[]>([]);
const performances = ref<Performance[]>([]);
const selectedNode = ref<TreeNode>();

const newPerfomanceItems = ref([
  { label: "Mündlich", icon: "pi pi-comment", command: () => {} },
  { label: "Spezial", icon: "pi pi-star", command: () => {} },
  { label: "Test", icon: "pi pi-file", command: () => {} },
]);

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
      console.log(performances.value);
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
    case 1:
    case 2:
      return { backgroundColor: "lightcoral" };
    case 4:
      return { backgroundColor: "lightgreen" };
    case 7:
      return { backgroundColor: "lightblue" };
    default:
      return {};
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
    <p-data-table
      v-if="selectedNode"
      :value="students"
      size="small"
      show-gridlines
      scrollable
      scroll-height="80vh"
      row-hover
      edit-mode="cell"
      class="table-area"
    >
      <template #header>
        <div style="display: grid; grid-template-columns: 1fr 1fr">
          <h2>{{ tableTitle }}</h2>
          <p-split-button
            :model="newPerfomanceItems"
            label="Neue Leistung"
            icon="pi pi-plus"
            outlined
            style="place-self: center end"
          />
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
        :header="performance.title"
        :style="backgroundColorByType(performance.type)"
        style="width: fit-content; max-width: 20px"
      >
        <template #body="{ data, column }">
          {{ data.grades.get(column.props.field)?.value }}
        </template>
        <template
          v-if="performance.editable"
          #editor="{ data, column }"
        >
          <p-input-text
            v-model="data.grades.get(column.props.field).value"
            style="width: 100%; padding-top: 3px; padding-bottom: 3px"
          />
        </template>
      </p-column>
    </p-data-table>
    <div
      v-else
      class="table-area"
      style="display: grid; place-items: center"
    >
      <h3>Bitte wählen Sie eine Klasse oder einen Kurs aus.</h3>
    </div>
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
