<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import SaveAndDeleteButtons from "@/components/layout/SaveAndDeleteButtons.vue";
import InputWithLabel from "@/components/layout/InputWithLabel.vue";
import ManagementPanel from "@/components/layout/ManagementPanel.vue";
import PInputGroup from "primevue/inputgroup";
import PAutoComplete, { type AutoCompleteCompleteEvent } from "primevue/autocomplete";
import PButton from "primevue/button";
import PSelectButton from "primevue/selectbutton";
import PRadioButton from "primevue/radiobutton";
import PCard from "primevue/card";
import PDivider from "primevue/divider";
import PDataTable from "primevue/datatable";
import PDataView from "primevue/dataview";
import PColumn from "primevue/column";
import { computed, onMounted, ref, watch } from "vue";
import type { Student } from "@/components/students/Student";
import { useStudents } from "@/components/students/StudentStore";
import type { Group } from "@/components/groups/Group";
import { useGroups } from "@/components/groups/GroupStore";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

const {
  groups,
  loadAllGroupsForSchoolYearAndSemester,
  loadStudentsForGroup,
  addGroup,
  editGroup,
  removeGroup,
  addStudentToGroup,
  removeStudentFromGroup,
} = useGroups();
const name = ref<string>();
const student = ref<Student>();
const groupType = ref<number>();

const { students, formatStudent } = useStudents();
const studentList = ref([...students.value]);

const selectedGroup = ref<Group | undefined>();
const selectedStudent = ref<Student | undefined>();

const { selectedSchoolYear } = useSchoolYearSelection();

async function handleSave() {
  if (selectedGroup.value?.id) {
    const group = {
      id: selectedGroup.value.id,
      name: name.value,
      sortingName: selectedGroup.value.sortingName,
      type: groupType.value,
      students: [],
    };

    await editGroup(group, selectedSchoolYear.value!, () => {
      resetInputs();
      selectedGroup.value = undefined;
    });
  } else {
    const group = {
      id: undefined,
      name: name.value,
      sortingName: undefined,
      type: groupType.value,
      students: [],
    };

    await addGroup(group, selectedSchoolYear.value!, () => {
      resetInputs();
      selectedGroup.value = undefined;
    });
  }
}

watch(selectedGroup, (current) => loadGroup(current));

function resetInputs() {
  name.value = undefined;
}

async function loadGroup(item: Group | undefined) {
  resetInputs();
  if (item?.id && item.id > 0) {
    const students = await loadStudentsForGroup(item);
    name.value = item?.name;
    item.students = students;
    groupType.value = item?.type;
  }
}

function formatGroup(item: Group) {
  return item.id === 0 ? "Neue Klasse anlegen" : item.name!;
}

async function handleRemove() {
  if (selectedGroup.value) {
    await removeGroup(selectedGroup.value, selectedSchoolYear.value!, () => {
      resetInputs();
      selectedGroup.value = undefined;
    });
  }
}

async function handleAddingStudent() {
  if (student.value) {
    await addStudentToGroup(student.value, selectedGroup.value!);
    await loadGroup(selectedGroup.value);
  }
}

async function handleRemovingStudent() {
  if (selectedStudent.value) {
    await removeStudentFromGroup(selectedStudent.value, selectedGroup.value!);
    await loadGroup(selectedGroup.value);
  }
}

function searchStudents(event: AutoCompleteCompleteEvent) {
  if (event.query === "") {
    studentList.value = [...students.value];
  } else {
    studentList.value = students.value.filter((it) => {
      return it.firstName?.includes(event.query) || it.lastName?.includes(event.query);
    });
  }
}

watch(selectedSchoolYear, async (current) => {
  if (current) {
    await loadAllGroupsForSchoolYearAndSemester(current);
    selectedGroup.value = undefined;
    resetInputs();
  }
});

onMounted(async () => {
  if (selectedSchoolYear.value) {
    await loadAllGroupsForSchoolYearAndSemester(selectedSchoolYear.value);
  }
});

const numberOfStudents = computed(() => {
  if (selectedGroup.value && selectedGroup.value.students && selectedGroup.value.students.length > 0) {
    return `${selectedGroup.value.students.length}`;
  } else {
    return "Keine";
  }
});

const layout = ref<"grid" | "list" | undefined>("grid");
const layoutOptions = ["list", "grid"];

watch(selectedStudent, (current) => {
  if (current) {
    student.value = current;
  } else {
    student.value = undefined;
  }
});

function toggleStudentSelection(selectionFromClick: Student) {
  if (selectionFromClick == selectedStudent.value) {
    selectedStudent.value = undefined;
  } else {
    selectedStudent.value = selectionFromClick;
  }
}
</script>

<template>
  <management-panel header="Klassen verwalten">
    <template #list>
      <entity-list
        v-model="selectedGroup"
        :entities="groups"
        :format="formatGroup"
      />
    </template>
    <template #edit>
      <p>
        Verwalten Sie hier ihre Klassen. Sie können Klassen anlegen oder bearbeiten, indem Sie den entsprechenden
        Eintrag in der Liste auswählen.
      </p>
      <p-divider />
      <custom-transition>
        <div
          v-show="selectedGroup"
          class="edit-area"
        >
          <div class="group-area">
            <p-card class="shadow-2">
              <template #title> Klasse </template>
              <template #content>
                <input-with-label
                  v-model="name"
                  identifier="nameField"
                  label="Name"
                />
                <div
                  class="mt-2"
                  style="display: grid; grid-template-columns: repeat(2, 1fr)"
                >
                  <div>
                    <p-radio-button
                      v-model="groupType"
                      input-id="sek1"
                      name="sek"
                      :value="0"
                    />
                    <label
                      for="sek1"
                      class="font-semibold"
                    >
                      Sekundarstufe I
                    </label>
                  </div>
                  <div>
                    <p-radio-button
                      v-model="groupType"
                      input-id="sek2"
                      name="sek"
                      :value="1"
                    />
                    <label
                      for="sek2"
                      class="font-semibold"
                    >
                      Sekundarstufe II
                    </label>
                  </div>
                </div>
              </template>
            </p-card>
            <save-and-delete-buttons
              :show-delete-when-defined="selectedGroup"
              :save-action="handleSave"
              :delete-action="handleRemove"
              :grid-columns="3"
            />
          </div>
          <div
            v-show="selectedGroup && selectedGroup.id && selectedGroup.id > 0"
            class="students-area"
          >
            <p-card class="shadow-2">
              <template #content>
                <p-data-view
                  :value="selectedGroup?.students"
                  :layout="layout"
                  data-key="id"
                  :pt="{
                    header: () => ({ style: { padding: '0 0 0.75rem 0' } }),
                  }"
                >
                  <template #header>
                    <div style="display: grid; grid-template-columns: auto auto; justify-content: space-between">
                      <div class="p-card-title">{{ numberOfStudents }} Schüler</div>
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
                      v-model:selection="selectedStudent"
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
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px 3px; padding-top: 3px">
                      <p-button
                        v-for="(studentItem, index) in gridProps.items"
                        :key="index"
                        outlined
                        severity="secondary"
                        style="padding: 2px"
                        :class="{
                          'highlight-button': selectedStudent == studentItem,
                        }"
                        @click="toggleStudentSelection(studentItem)"
                      >
                        {{ index + 1 }}.
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
                      Schüler zur Klasse hinzufügen
                    </label>
                    <p-input-group>
                      <p-button
                        icon="pi pi-check"
                        severity="success"
                        :disabled="!student"
                        @click="handleAddingStudent"
                      />
                      <p-auto-complete
                        v-model="student"
                        input-id="pupilName"
                        :option-label="formatStudent"
                        :suggestions="studentList"
                        class="w-full"
                        force-selection
                        @complete="searchStudents"
                      >
                        <template #option="slotProps">
                          <span>{{ formatStudent(slotProps.option) }}</span>
                        </template>
                      </p-auto-complete>
                      <p-button
                        icon="pi pi-times"
                        severity="danger"
                        :disabled="!student"
                        @click="handleRemovingStudent"
                      />
                    </p-input-group>
                  </div>
                </div>
              </template>
            </p-card>
          </div>
        </div>
      </custom-transition>
    </template>
  </management-panel>
</template>

<style scoped>
.edit-area {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 1rem;
}

.group-area {
  grid-column: 1 / span 4;
}

.students-area {
  grid-column: 5 / span 8;
}

.label-over-input {
  display: grid;
  grid-template-columns: auto;
}

.highlight-button {
  background-color: var(--p-highlight-focus-background);
  color: var(--p-highlight-color);
}
</style>
