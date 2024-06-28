<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import SaveAndDeleteButtons from "@/components/layout/SaveAndDeleteButtons.vue";
import InputWithLabel from "@/components/layout/InputWithLabel.vue";
import ManagementPanel from "@/components/layout/ManagementPanel.vue";
import InputGroup from "primevue/inputgroup";
import AutoComplete, {
  type AutoCompleteCompleteEvent,
} from "primevue/autocomplete";
import PButton from "primevue/button";
import Card from "primevue/card";
import Divider from "primevue/divider";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { computed, onMounted, ref, watch } from "vue";
import type { Student } from "@/components/students/Student";
import { useStudents } from "@/components/students/StudentStore";
import type { Group } from "@/components/groups/Group";
import { useGroups } from "@/components/groups/GroupStore";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

const { groups, loadAllGroupsForSchoolYearAndSemester, loadStudentsForGroup } =
  useGroups();
const name = ref<string>();
const student = ref<Student>();

const { students, formatStudent } = useStudents();
const studentList = ref([...students.value]);

const idCounter = ref(1);

const selectedGroup = ref<Group | undefined>();
const selectedStudent = ref<Student | undefined>();

const { selectedSchoolYear, selectedSemester } = useSchoolYearSelection();

function addGroup() {
  if (
    selectedGroup.value &&
    selectedGroup.value.id &&
    selectedGroup.value.id > 0
  ) {
    const group = {
      id: selectedGroup.value.id,
      name: name.value,
      students: [],
    };

    const index = groups.value.findIndex((it) => {
      return it.id == group.id;
    });

    groups.value.splice(index, 1, group);
  } else {
    groups.value?.push({
      id: idCounter.value,
      name: name.value,
      students: [],
    });

    idCounter.value++;
  }

  resetInputs();
  selectedGroup.value = undefined;
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
  }
}

function formatGroup(item: Group) {
  return item.id === 0 ? "Neue Klasse anlegen" : item.name!;
}

function removeGroup() {
  const index = groups.value.findIndex((it) => {
    return it.id == selectedGroup.value?.id;
  });

  groups.value.splice(index, 1);
}

function addStudentToGroup() {
  if (student.value) {
    selectedGroup.value?.students?.push(student.value);
    student.value = undefined;
  }
}

function searchStudents(event: AutoCompleteCompleteEvent) {
  if (event.query === "") {
    studentList.value = [...students.value];
  } else {
    studentList.value = students.value.filter((it) => {
      return (
        it.firstName?.includes(event.query) ||
        it.lastName?.includes(event.query)
      );
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
  if (
    selectedGroup.value &&
    selectedGroup.value.students &&
    selectedGroup.value.students.length > 0
  ) {
    return `${selectedGroup.value.students.length}`;
  } else {
    return "Keine";
  }
});
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
        Verwalten Sie hier ihre Klassen. Sie können Klassen anlegen oder
        bearbeiten, indem Sie den entsprechenden Eintrag in der Liste auswählen.
      </p>
      <divider />
      <custom-transition>
        <div
          v-show="selectedGroup"
          class="edit-area"
        >
          <div class="group-area">
            <card class="shadow-2">
              <template #title> Klasse </template>
              <template #content>
                <input-with-label
                  v-model="name"
                  identifier="nameField"
                  label="Name"
                />
              </template>
            </card>
            <save-and-delete-buttons
              :show-delete-when-defined="selectedGroup"
              :save-action="addGroup"
              :delete-action="removeGroup"
              :grid-columns="3"
            />
          </div>
          <div
            v-show="selectedGroup && selectedGroup.id && selectedGroup.id > 0"
            class="students-area"
          >
            <card class="shadow-2">
              <template #title> {{ numberOfStudents }} Schüler </template>
              <template #content>
                <data-table
                  v-model:selection="selectedStudent"
                  :value="selectedGroup?.students"
                  data-key="id"
                  selection-mode="single"
                  scrollable
                  scroll-height="55vh"
                >
                  <column header="#">
                    <template #body="slotProps">
                      {{ slotProps.index + 1 }}
                    </template>
                  </column>
                  <column header="Name">
                    <template #body="slotProps">
                      {{ slotProps.data.firstName }}
                      {{ slotProps.data.lastName }}
                    </template>
                  </column>
                </data-table>
                <div class="label-over-input mt-2">
                  <div>
                    <label
                      for="pupilName"
                      class="font-semibold"
                    >
                      Schüler zur Klasse hinzufügen
                    </label>
                    <input-group>
                      <auto-complete
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
                      </auto-complete>
                      <p-button
                        icon="pi pi-check"
                        security="success"
                        @click="addStudentToGroup"
                      />
                    </input-group>
                  </div>
                </div>
              </template>
            </card>
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
  grid-column: 1 / span 5;
}

.students-area {
  grid-column: 6 / span 7;
}

.label-over-input {
  display: grid;
  grid-template-columns: auto;
}
</style>
