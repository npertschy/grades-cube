<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import InputText from "primevue/inputtext";
import InputGroup from "primevue/inputgroup";
import AutoComplete, {
  type AutoCompleteCompleteEvent,
} from "primevue/autocomplete";
import Button from "primevue/button";
import Card from "primevue/card";
import Divider from "primevue/divider";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { ref, watch } from "vue";
import type { Student } from "@/components/students/Student";
import { useStudents } from "@/components/students/StudentStore";

const name = ref<string>();
const student = ref<Student>();

const { students, formatStudent } = useStudents();
const studentList = ref([...students.value]);

const idCounter = ref(1);

type Group = {
  id: number;
  name: string | undefined;
  students: Student[];
};

const groups = ref<Group[]>([
  {
    id: 0,
    name: undefined,
    students: [],
  },
]);

const selectedGroup = ref<Group | undefined>();
const selectedStudent = ref<Student | undefined>();

function addGroup() {
  if (selectedGroup.value && selectedGroup.value.id > 0) {
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

function loadGroup(item: Group | undefined) {
  resetInputs();
  if (item?.id && item.id > 0) {
    name.value = item?.name;
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
    selectedGroup.value?.students.push(student.value);
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
</script>

<template>
  <Card>
    <template #title> Klassen verwalten </template>
    <template #content>
      <div class="grid nested-grid">
        <div class="col-2">
          <EntityList
            v-model="selectedGroup"
            :entities="groups"
            :format="formatGroup"
          />
        </div>
        <div class="col-offset-1 col-8">
          <p>
            Verwalten Sie hier ihre Klassen. Sie können Klassen anlegen oder
            bearbeiten, indem Sie den entsprechenden Eintrag in der Liste
            auswählen.
          </p>
          <Divider />
          <CustomTransition>
            <div
              v-show="selectedGroup"
              class="grid gap-2"
            >
              <div class="col-4">
                <div class="grid">
                  <Card class="shadow-2 col-12">
                    <template #title> Klasse </template>
                    <template #content>
                      <div class="formgrid grid">
                        <div class="field col">
                          <label
                            for="nameField"
                            class="font-semibold"
                          >
                            Name
                          </label>
                          <InputText
                            v-model="name"
                            input-id="nameField"
                            class="w-full"
                          />
                        </div>
                      </div>
                    </template>
                  </Card>
                  <div class="mt-2 col-12">
                    <Button
                      label="Submit"
                      class="col-3"
                      @click="addGroup"
                    />
                    <Button
                      v-show="selectedGroup && selectedGroup.id > 0"
                      label="Delete"
                      class="col-3 col-offset-6"
                      @click="removeGroup"
                    />
                  </div>
                </div>
              </div>
              <div
                v-show="selectedGroup && selectedGroup.id > 0"
                class="col"
              >
                <div class="grid">
                  <Card class="shadow-2 col-12">
                    <template #title> Schüler </template>
                    <template #content>
                      <DataTable
                        v-model:selection="selectedStudent"
                        :value="selectedGroup?.students"
                        data-key="id"
                        selection-mode="single"
                      >
                        <Column header="#">
                          <template #body="slotProps">
                            {{ slotProps.index }}
                          </template>
                        </Column>
                        <Column header="Name">
                          <template #body="slotProps">
                            {{ slotProps.data.firstName }}
                            {{ slotProps.data.lastName }}
                          </template>
                        </Column>
                      </DataTable>
                      <div class="formgrid grid mt-2">
                        <div class="field col">
                          <label
                            for="pupilName"
                            class="font-semibold"
                          >
                            Schüler zur Klasse hinzufügen
                          </label>
                          <InputGroup>
                            <AutoComplete
                              v-model="student"
                              input-id="pupilName"
                              :option-label="formatStudent"
                              :suggestions="studentList"
                              class="w-full"
                              force-selection
                              @complete="searchStudents"
                            >
                              <template #option="slotProps">
                                <span>{{
                                  formatStudent(slotProps.option)
                                }}</span>
                              </template>
                            </AutoComplete>
                            <Button
                              icon="pi pi-check"
                              security="success"
                              @click="addStudentToGroup"
                            />
                          </InputGroup>
                        </div>
                      </div>
                    </template>
                  </Card>
                </div>
              </div>
            </div>
          </CustomTransition>
        </div>
      </div>
    </template>
  </Card>
</template>
