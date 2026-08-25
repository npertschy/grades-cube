<script setup lang="ts">
import PPanel from "primevue/panel";
import PDataView from "primevue/dataview";
import PDataTable from "primevue/datatable";
import PColumn from "primevue/column";
import PSelectButton from "primevue/selectbutton";
import PButton from "primevue/button";
import PInputGroup from "primevue/inputgroup";
import PAutoComplete, { type AutoCompleteCompleteEvent } from "primevue/autocomplete";
import { ref, computed } from "vue";
import type { Student } from "../students/Student";
import { useStudents } from "../students/StudentStore";

const { studentList } = defineProps<{
  studentList: Student[];
}>();

const emit = defineEmits<{
  (e: "addStudent", student: Student): void;
  (e: "removeStudent", student: Student): void;
}>();

const { students, formatStudent } = useStudents();

const layout = ref<"grid" | "list">("grid");
const layoutOptions = ["grid", "list"];

const numberOfStudents = computed(() => {
  if (studentList && studentList.length > 0) {
    return `${studentList.length}`;
  } else {
    return "Keine";
  }
});

function toggleStudentSelection(selectionFromClick: Student) {
  if (selectionFromClick == student.value) {
    student.value = undefined;
  } else {
    student.value = selectionFromClick;
  }
}

const student = ref<Student>();
const studentQuery = ref("");
const studentSuggestions = computed<Student[]>(() => {
  if (studentQuery.value === "") {
    return [...students.value];
  } else {
    return students.value.filter((it) => {
      return it.firstName?.includes(studentQuery.value) || it.lastName?.includes(studentQuery.value);
    });
  }
});

function handleAddStudent() {
  emit("addStudent", student.value!);
  student.value = undefined;
}

function handleRemoveStudent() {
  emit("removeStudent", student.value!);
  student.value = undefined;
}
</script>

<template>
  <p-panel :pt="{ header: { style: { display: 'none' } } }">
    <p-data-view
      :value="studentList"
      :layout="layout"
      data-key="id"
      :pt="{
        header: () => ({ style: { padding: '18px 0 0.75rem 0' } }),
      }"
    >
      <template #header>
        <div class="header-grid">
          <div class="font-bold">{{ numberOfStudents }} Schüler</div>
          <p-select-button
            v-model="layout"
            :options="layoutOptions"
            :allow-empty="false"
          >
            <template #option="{ option }">
              <i :class="[option === 'list' ? 'pi pi-bars' : 'pi pi-table']" />
            </template>
          </p-select-button>
        </div>
      </template>
      <template #list="listProps">
        <p-data-table
          v-model:selection="student"
          :value="listProps.items"
          data-key="id"
          selection-mode="single"
          scrollable
          scroll-height="55vh"
        >
          <p-column header="#">
            <template #body="headerProps">
              {{ headerProps.index + 1 }}
            </template>
          </p-column>
          <p-column header="Name">
            <template #body="bodyProps">
              {{ bodyProps.data.firstName }}
              {{ bodyProps.data.lastName }}
            </template>
          </p-column>
        </p-data-table>
      </template>
      <template #grid="gridProps">
        <div class="dataview-grid">
          <p-button
            v-for="(studentItem, index) in gridProps.items"
            :key="studentItem.id"
            outlined
            severity="secondary"
            style="padding: 2px"
            :class="{
              'highlight-button': student == studentItem,
            }"
            @click="toggleStudentSelection(studentItem)"
          >
            {{ Number(index) + 1 }}.
            {{ formatStudent(studentItem) }}
          </p-button>
        </div>
      </template>
    </p-data-view>
    <div class="label-over-input mt-2">
      <div>
        <label
          for="pupilName"
          class="font-semibold"
        >
          Schüler zum Kurs hinzufügen
        </label>
        <p-input-group class="mt-2">
          <p-button
            icon="pi pi-check"
            severity="success"
            :disabled="!student"
            @click="handleAddStudent"
          />
          <p-auto-complete
            v-model="student"
            input-id="pupilName"
            :option-label="formatStudent"
            :suggestions="studentSuggestions"
            class="w-full"
            force-selection
            @complete="(event: AutoCompleteCompleteEvent) => (studentQuery = event.query)"
          >
            <template #option="slotProps">
              <span>{{ formatStudent(slotProps.option) }}</span>
            </template>
          </p-auto-complete>
          <p-button
            icon="pi pi-times"
            severity="danger"
            :disabled="!student"
            @click="handleRemoveStudent"
          />
        </p-input-group>
      </div>
    </div>
  </p-panel>
</template>

<style scoped>
.label-over-input {
  display: grid;
  grid-template-columns: auto;
}

.header-grid {
  display: grid;
  grid-template-columns: auto auto;
  justify-content: space-between;
}

.font-bold {
  font-size: 1.25rem;
  font-weight: bold;
}

.dataview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px 3px;
  padding-top: 3px;
}

.highlight-button {
  background-color: var(--p-highlight-focus-background);
  color: var(--p-highlight-color);
}
</style>
