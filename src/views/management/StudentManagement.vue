<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import SaveAndDeleteButtons from "@/components/layout/SaveAndDeleteButtons.vue";
import InputWithLabel from "@/components/layout/InputWithLabel.vue";
import ManagementPanel from "@/components/layout/ManagementPanel.vue";
import SchoolYearSelectionContainer from "@/components/schoolYears/SchoolYearSelectionContainer.vue";
import ContentEditingPanel from "@/components/layout/ContentEditingPanel.vue";
import PDivider from "primevue/divider";
import PPanel from "primevue/panel";
import PInputGroup from "primevue/inputgroup";
import PAutoComplete, { type AutoCompleteCompleteEvent } from "primevue/autocomplete";
import PButton from "primevue/button";
import { computed, ref, shallowRef, watch, onMounted } from "vue";
import type { Student } from "@/components/students/Student";
import { useStudents } from "@/components/students/StudentStore";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import type { Group } from "@/components/groups/Group";
import type { Course } from "@/components/courses/Course";
import { useUiErrorHandling } from "@/components/errors/ErrorHandling";

const firstName = ref<string>();
const lastName = ref<string>();

const {
  students,
  loadStudentsForSchoolYear,
  loadGroupsAndCoursesFor,
  addStudent,
  editStudent,
  formatStudent,
  removeStudent,
  loadGroupsForSchoolYear,
  loadCoursesForSchoolYearAndSemester,
  addGroupToStudent,
  removeGroupFromStudent,
  addCourseToStudent,
  removeCourseFromStudent,
} = useStudents();
const { selectedSchoolYear, selectedSemester } = useSchoolYearSelection();

const { runSafeWithToast, confirmAction } = useUiErrorHandling();

const selectedStudent = ref<Student | undefined>();
const availableGroups = ref<Group[]>([]);
const availableCourses = ref<Course[]>([]);

const selectedGroup = ref<Group>();
const groupQuery = shallowRef("");
const groupList = computed<Group[]>(() => {
  if (groupQuery.value === "") {
    return [...availableGroups.value];
  }
  return availableGroups.value.filter((g) => g.name?.toLowerCase().includes(groupQuery.value.toLowerCase()));
});

const selectedCourse = ref<Course>();
const courseQuery = shallowRef("");
const courseList = computed<Course[]>(() => {
  if (courseQuery.value === "") {
    return [...availableCourses.value];
  }
  return availableCourses.value.filter(
    (c) =>
      c.group?.name?.toLowerCase().includes(courseQuery.value.toLowerCase()) ||
      c.subject?.name?.toLowerCase().includes(courseQuery.value.toLowerCase()),
  );
});

onMounted(async () => {
  if (selectedSchoolYear.value) {
    const [_, groups, courses] = await Promise.all([
      loadStudentsForSchoolYear(selectedSchoolYear.value),
      loadGroupsForSchoolYear(selectedSchoolYear.value),
      loadCoursesForSchoolYearAndSemester(selectedSchoolYear.value, selectedSemester.value!),
    ]);
    availableGroups.value = groups;
    availableCourses.value = courses;
  }
});

async function handleSave() {
  await runSafeWithToast(async () => {
    if (selectedStudent.value?.id) {
      const student = {
        id: selectedStudent.value.id,
        firstName: firstName.value,
        lastName: lastName.value,
        groups: undefined,
        courses: undefined,
      };

      await editStudent(student, selectedSchoolYear.value!, () => {
        resetInputs();
        selectedStudent.value = undefined;
      });
    } else {
      const student: Student = {
        id: undefined,
        firstName: firstName.value,
        lastName: lastName.value,
        groups: undefined,
        courses: undefined,
      };
      await addStudent(student, selectedSchoolYear.value!, () => {
        resetInputs();
        selectedStudent.value = undefined;
      });
    }
  });
}

watch(selectedStudent, (current) => loadStudent(current));

function resetInputs() {
  firstName.value = undefined;
  lastName.value = undefined;
}

async function loadStudent(item: Student | undefined) {
  resetInputs();
  if (item && item.id && item.id > 0 && selectedSchoolYear.value && selectedSemester.value) {
    const student = await loadGroupsAndCoursesFor(item, selectedSchoolYear.value, selectedSemester.value);
    firstName.value = student?.firstName;
    lastName.value = student?.lastName;
    item.groups = student?.groups;
    item.courses = student?.courses;
  }
}

function handleRemove() {
  if (!selectedStudent.value) return;
  const student = selectedStudent.value;
  confirmAction("Schüler löschen", `Soll "${formatStudent(student)}" wirklich gelöscht werden?`, async () => {
    await removeStudent(student, selectedSchoolYear.value!, () => {
      resetInputs();
      selectedStudent.value = undefined;
    });
  });
}

function toggleGroupSelection(group: Group) {
  if (group == selectedGroup.value) {
    selectedGroup.value = undefined;
  } else {
    selectedGroup.value = group;
  }
}

async function handleAddGroup() {
  if (!selectedGroup.value || !selectedStudent.value) return;

  await runSafeWithToast(async () => {
    await addGroupToStudent(selectedStudent.value!, selectedGroup.value!);
    await loadStudent(selectedStudent.value);
    selectedGroup.value = undefined;
  });
}

async function handleRemoveGroup(group: Group) {
  if (!selectedStudent.value) return;

  await runSafeWithToast(async () => {
    await removeGroupFromStudent(selectedStudent.value!, group);
    await loadStudent(selectedStudent.value);
  });
}

function toggleCourseSelection(course: Course) {
  if (course == selectedCourse.value) {
    selectedCourse.value = undefined;
  } else {
    selectedCourse.value = course;
  }
}

async function handleAddCourse() {
  if (!selectedCourse.value || !selectedStudent.value) return;

  await runSafeWithToast(async () => {
    await addCourseToStudent(selectedStudent.value!, selectedCourse.value!);
    await loadStudent(selectedStudent.value);
    selectedCourse.value = undefined;
  });
}

async function handleRemoveCourse(course: Course) {
  if (!selectedStudent.value) return;

  await runSafeWithToast(async () => {
    await removeCourseFromStudent(selectedStudent.value!, course);
    await loadStudent(selectedStudent.value);
  });
}

function formatCourse(course: Course) {
  return course.group?.name + " " + course.subject?.name;
}

watch(selectedSchoolYear, async (current) => {
  if (current) {
    await loadStudentsForSchoolYear(current);
    selectedStudent.value = undefined;
    availableGroups.value = await loadGroupsForSchoolYear(current);
    availableCourses.value = await loadCoursesForSchoolYearAndSemester(current, selectedSemester.value!);
    resetInputs();
  }
});

watch(selectedSemester, async (current) => {
  if (current) {
    availableCourses.value = await loadCoursesForSchoolYearAndSemester(selectedSchoolYear.value!, current);

    const previouslySelection = selectedStudent.value;
    selectedStudent.value = students.value.find((student) => {
      return student.id === previouslySelection?.id;
    });
    document.getElementsByClassName("p-listbox-item p-highlight").item(0)?.scrollIntoView(true);
  }
});
</script>

<template>
  <school-year-selection-container :selected-school-year="selectedSchoolYear">
    <management-panel header="Schüler verwalten">
      <template #list>
        <div style="height: 80vh">
          <entity-list
            v-model="selectedStudent"
            :entities="students"
            :format="formatStudent"
            filter
            :filter-fields="['firstName', 'lastName']"
          />
        </div>
      </template>
      <template #edit>
        <p>
          Verwalten Sie hier ihre Schüler. Sie können Schüler anlegen oder bearbeiten, indem Sie den entsprechenden
          Eintrag in der Liste auswählen.
        </p>
        <p-divider />
        <custom-transition>
          <div
            v-show="selectedStudent"
            class="edit-area"
          >
            <div class="student-area">
              <content-editing-panel header="Schüler">
                <input-with-label
                  v-model="firstName"
                  identifier="firstNameField"
                  label="Vorname"
                />
                <input-with-label
                  v-model="lastName"
                  identifier="lastNameField"
                  label="Nachname"
                  class="mt-2"
                />
                <save-and-delete-buttons
                  :show-delete-when-defined="selectedStudent"
                  :save-action="handleSave"
                  :delete-action="handleRemove"
                  :grid-columns="3"
                />
              </content-editing-panel>
            </div>
            <div
              v-show="selectedStudent && selectedStudent.id && selectedStudent.id > 0"
              class="assignments-area"
            >
              <p-panel header="Klassen">
                <div class="assignment-list">
                  <p-button
                    v-for="group in selectedStudent?.groups"
                    :key="group.id"
                    outlined
                    severity="secondary"
                    size="small"
                    :class="{
                      'highlight-button': selectedGroup == group,
                    }"
                    :label="group.name!"
                    @click="toggleGroupSelection(group)"
                  />
                </div>
                <div class="mt-2">
                  <label
                    for="groupField"
                    class="font-semibold"
                  >
                    Klasse hinzufügen
                  </label>
                  <p-input-group class="mt-2">
                    <p-button
                      icon="pi pi-check"
                      severity="success"
                      :disabled="!selectedGroup"
                      @click="handleAddGroup"
                    />
                    <p-auto-complete
                      v-model="selectedGroup"
                      input-id="groupField"
                      :option-label="(g: Group) => g.name!"
                      :suggestions="groupList"
                      class="w-full"
                      force-selection
                      @complete="(event: AutoCompleteCompleteEvent) => (groupQuery = event.query)"
                    />
                    <p-button
                      icon="pi pi-times"
                      severity="danger"
                      :disabled="!selectedGroup"
                      @click="handleRemoveGroup(selectedGroup!)"
                    />
                  </p-input-group>
                </div>
              </p-panel>
              <p-panel header="Kurse">
                <div class="assignment-list">
                  <p-button
                    v-for="course in selectedStudent?.courses"
                    :key="course.id"
                    outlined
                    severity="secondary"
                    size="small"
                    :label="formatCourse(course)"
                    :class="{
                      'highlight-button': selectedCourse == course,
                    }"
                    @click="toggleCourseSelection(course)"
                  />
                </div>
                <div class="mt-2">
                  <label
                    for="courseField"
                    class="font-semibold"
                  >
                    Kurs hinzufügen
                  </label>
                  <p-input-group class="mt-2">
                    <p-button
                      icon="pi pi-check"
                      severity="success"
                      :disabled="!selectedCourse"
                      @click="handleAddCourse"
                    />
                    <p-auto-complete
                      v-model="selectedCourse"
                      input-id="courseField"
                      :option-label="formatCourse"
                      :suggestions="courseList"
                      class="w-full"
                      force-selection
                      @complete="(event: AutoCompleteCompleteEvent) => (courseQuery = event.query)"
                    />
                    <p-button
                      icon="pi pi-times"
                      severity="danger"
                      :disabled="!selectedCourse"
                      @click="handleRemoveCourse(selectedCourse!)"
                    />
                  </p-input-group>
                </div>
              </p-panel>
            </div>
          </div>
        </custom-transition>
      </template>
    </management-panel>
  </school-year-selection-container>
</template>

<style scoped>
.edit-area {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 1rem;
}

.student-area {
  grid-column: 1 / span 4;
}

.assignments-area {
  grid-column: 5 / span 8;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assignment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.highlight-button {
  background-color: var(--p-highlight-focus-background);
  color: var(--p-highlight-color);
}
</style>
