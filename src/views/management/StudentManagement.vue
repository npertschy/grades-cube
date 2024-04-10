<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import InputText from "primevue/inputtext";
import Listbox from "primevue/listbox";
import Button from "primevue/button";
import Card from "primevue/card";
import Divider from "primevue/divider";
import { ref, watch } from "vue";
import type { Student } from "@/components/students/Student";
import { useStudents } from "@/components/students/StudentStore";

const firstName = ref<string>();
const lastName = ref<string>();

const { students, addStudent, formatStudent, removeStudent } = useStudents();

const selectedStudent = ref<Student | undefined>();

function handleSave() {
  const id = selectedStudent.value ? selectedStudent.value.id : undefined;
  const student = {
    id: id,
    firstName: firstName.value,
    lastName: lastName.value,
  };

  addStudent(student, () => {
    resetInputs();
    selectedStudent.value = undefined;
  });
}

watch(selectedStudent, (current) => loadStudent(current));

function resetInputs() {
  firstName.value = undefined;
  lastName.value = undefined;
}

function loadStudent(item: Student | undefined) {
  resetInputs();
  if (item?.id && item.id > 0) {
    firstName.value = item?.firstName;
    lastName.value = item?.lastName;
  }
}

function handleRemove() {
  if (selectedStudent.value) {
    removeStudent(selectedStudent.value);
  }
}
</script>

<template>
  <Card>
    <template #title>Schüler verwalten</template>
    <template #content>
      <div class="container">
        <div style="height: 80vh">
          <Listbox
            v-model="selectedStudent"
            :options="students"
            class="shadow-2"
            list-style="max-height:80vh"
          >
            <template #option="slotProps">
              <p class="text-center">
                {{ formatStudent(slotProps.option) }}
              </p>
            </template>
          </Listbox>
        </div>
        <div class="edit-area">
          <p>
            Verwalten Sie hier ihre Schüler. Sie können Schüler anlegen oder
            bearbeiten, indem Sie den entsprechenden Eintrag in der Liste
            auswählen.
          </p>
          <Divider />
          <CustomTransition>
            <div v-show="selectedStudent">
              <Card class="shadow-2">
                <template #title>Schüler</template>
                <template #content>
                  <div class="label-over-input">
                    <div>
                      <label for="firstNameField" class="font-semibold">
                        Vorname
                      </label>
                      <InputText
                        input-id="firstNameField"
                        v-model="firstName"
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label for="lastNameField" class="font-semibold">
                        Nachname
                      </label>
                      <InputText
                        input-id="lastNameField"
                        v-model="lastName"
                        class="w-full"
                      />
                    </div>
                  </div>
                </template>
              </Card>

              <div class="mt-2 button-area">
                <Button label="Submit" class="" @click="handleSave" />
                <Button
                  v-show="
                    selectedStudent &&
                    selectedStudent.id &&
                    selectedStudent.id > 0
                  "
                  label="Delete"
                  class="delete-button"
                  @click="handleRemove"
                />
              </div>
            </div>
          </CustomTransition>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-columns: 2fr repeat(10, 1fr);
  column-gap: 1rem;
}

.edit-area {
  grid-column: 3 / span 8;
}

.label-over-input {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 0.5rem;
}

.button-area {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
}

.delete-button {
  grid-column: 8 / span 1;
}
</style>
