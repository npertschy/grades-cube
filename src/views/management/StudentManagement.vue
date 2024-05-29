<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import SaveAndDeleteButtons from "@/components/layout/SaveAndDeleteButtons.vue";
import InputWithLabel from "@/components/layout/InputWithLabel.vue";
import AutoCompleteListWithLabel from "@/components/layout/AutoCompleteListWithLabel.vue";
import ManagementPanel from "@/components/layout/ManagementPanel.vue";
import SchoolYearSelectionContainer from "@/components/schoolYears/SchoolYearSelectionContainer.vue";
import Card from "primevue/card";
import Divider from "primevue/divider";
import { ref, watch, onMounted } from "vue";
import type { Student } from "@/components/students/Student";
import { useStudents } from "@/components/students/StudentStore";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import type { Group } from "@/components/groups/Group";
import type { Course } from "@/components/courses/Course";

const firstName = ref<string>();
const lastName = ref<string>();
const groups = ref<Group[]>();
const courses = ref<Course[]>();

const {
  students,
  loadStudentsForSchoolYear,
  loadGroupsAndCoursesFor,
  addStudent,
  formatStudent,
  removeStudent,
} = useStudents();
const { selectedSchoolYear, selectedSemester } = useSchoolYearSelection();

const selectedStudent = ref<Student | undefined>();

async function handleSave() {
  if (selectedStudent.value?.id) {
    const student = {
      id: selectedStudent.value.id,
      firstName: firstName.value,
      lastName: lastName.value,
    };
  } else {
    const student: Student = {
      id: undefined,
      firstName: firstName.value,
      lastName: lastName.value,
      groups: undefined,
      courses: undefined,
    };
    await addStudent(
      student,
      selectedSchoolYear.value!,
      selectedSemester.value!,
      () => {
        resetInputs();
        selectedStudent.value = undefined;
      },
    );
  }
}

watch(selectedStudent, (current) => loadStudent(current));

function resetInputs() {
  firstName.value = undefined;
  lastName.value = undefined;
}

async function loadStudent(item: Student | undefined) {
  resetInputs();
  if (item && selectedSchoolYear.value && selectedSemester.value) {
    const student = await loadGroupsAndCoursesFor(item!, selectedSchoolYear.value, selectedSemester.value)
    firstName.value = student?.firstName;
    lastName.value = student?.lastName;
    groups.value = student?.groups;
    courses.value = student?.courses;
  }
}

async function handleRemove() {
  if (selectedStudent.value) {
    await removeStudent(
      selectedStudent.value,
      selectedSchoolYear.value!,
      selectedSemester.value!,
      () => {
        resetInputs();
        selectedStudent.value = undefined;
      },
    );
  }
}

watch(selectedSchoolYear, async (current) => {
  if (current) {
    await loadStudentsForSchoolYear(current, selectedSemester.value!);
    selectedStudent.value = undefined;
    resetInputs();
  }
});

watch(selectedSemester, async (current) => {
  if (current) {
    const previouslySelection = selectedStudent.value;
    await loadStudentsForSchoolYear(selectedSchoolYear.value!, current);
    selectedStudent.value = students.value.find((student) => {
      return student.id === previouslySelection?.id;
    });
    document
      .getElementsByClassName("p-listbox-item p-highlight")
      .item(0)
      ?.scrollIntoView(true);
  }
});

onMounted(async () => {
  if (selectedSchoolYear.value) {
    await loadStudentsForSchoolYear(
      selectedSchoolYear.value,
      selectedSemester.value!,
    );
  }
});
</script>

<template>
  <school-year-selection-container :selected-school-year="selectedSchoolYear">
    <management-panel header="Schüler verwalten">
      <template #list>
        <div style="height: 80vh">
          <entity-list v-model="selectedStudent" :entities="students" :format="formatStudent" filter
            :filter-fields="['firstName', 'lastName']" />
        </div>
      </template>
      <template #edit>
        <p>
          Verwalten Sie hier ihre Schüler. Sie können Schüler anlegen oder
          bearbeiten, indem Sie den entsprechenden Eintrag in der Liste
          auswählen.
        </p>
        <divider />
        <custom-transition>
          <div v-show="selectedStudent">
            <card class="shadow-2">
              <template #title>Schüler</template>
              <template #content>
                <div class="label-over-input">
                  <input-with-label v-model="firstName" identifier="firstNameField" label="Vorname" />
                  <input-with-label v-model="lastName" identifier="lastNameField" label="Nachname" />
                  <auto-complete-list-with-label v-model="groups" identifier="groupField" label="Klassen" :items="[]"
                    :option="(group: Group) => group.name!" />
                  <auto-complete-list-with-label v-model="courses" identifier="courseField" label="Kurse" :items="[]"
                    :option="(course: Course) =>
                      course.group?.name! + ' ' + course.subject?.name
                      " />
                </div>
              </template>
            </card>
            <save-and-delete-buttons :show-delete-when-defined="selectedStudent" :save-action="handleSave"
              :delete-action="handleRemove" />
          </div>
        </custom-transition>
      </template>
    </management-panel>
  </school-year-selection-container>
</template>

<style scoped>
.label-over-input {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 0.5rem;
  row-gap: 1.5rem;
}
</style>
