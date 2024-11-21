<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import SaveAndDeleteButtons from "@/components/layout/SaveAndDeleteButtons.vue";
import ObjectAutoCompleteWithLabel from "@/components/layout/ObjectAutoCompleteWithLabel.vue";
import ManagementPanel from "@/components/layout/ManagementPanel.vue";
import PInputGroup from "primevue/inputgroup";
import PAutoComplete, { type AutoCompleteCompleteEvent } from "primevue/autocomplete";
import PButton from "primevue/button";
import PSelectButton from "primevue/selectbutton";
import PCard from "primevue/card";
import PDivider from "primevue/divider";
import PDataTable from "primevue/datatable";
import PDataView from "primevue/dataview";
import PColumn from "primevue/column";
import { computed, onMounted, ref, watch } from "vue";
import type { Student } from "@/components/students/Student";
import { useStudents } from "@/components/students/StudentStore";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import { useCourses } from "@/components/courses/CourseStore";
import type { Course } from "@/components/courses/Course";
import type { Group } from "@/components/groups/Group";
import type { Subject } from "@/components/subjects/Subject";

const {
  courses,
  loadAllCoursesForSchoolYearAndSemester,
  loadStudentsForCourse,
  loadAvailableGroupsForSchoolYear,
  loadAvailableSubjectsForSchoolYear,
  addCourse,
  editCourse,
  removeCourse,
  addStudentToCourse,
  removeStudentFromCourse,
} = useCourses();
const student = ref<Student>();
const group = ref<Group>();
const subject = ref<Subject>();
const studentsOfCourse = ref<Student[]>([]);

const { students, formatStudent } = useStudents();
const studentList = ref([...students.value]);

const availableGroups = ref<Group[]>([]);
const availableSubjects = ref<Subject[]>([]);

const selectedCourse = ref<Course | undefined>();
const selectedStudent = ref<Student | undefined>();

const { selectedSchoolYear, selectedSemester } = useSchoolYearSelection();

async function handleSave() {
  if (selectedCourse.value?.id) {
    const course: Course = {
      id: selectedCourse.value.id,
      group: group.value,
      subject: subject.value,
      schoolYear: selectedCourse.value.schoolYear,
      semester: selectedCourse.value.semester,
      days: selectedCourse.value.days,
    };

    await editCourse(course, selectedSchoolYear.value!, selectedSemester.value!, () => {
      resetInputs();
      selectedCourse.value = undefined;
    });
  } else {
    const course = {
      id: undefined,
      group: group.value,
      subject: subject.value,
      schoolYear: selectedSchoolYear.value!,
      semester: selectedSemester.value!,
      days: [],
    };

    await addCourse(course, selectedSchoolYear.value!, selectedSemester.value!, () => {
      resetInputs();
      selectedCourse.value = undefined;
    });
  }
}

watch(selectedCourse, (current) => loadCourse(current));

function resetInputs() {
  group.value = undefined;
  subject.value = undefined;
  studentsOfCourse.value = [];
}

async function loadCourse(item: Course | undefined) {
  resetInputs();
  if (item?.id && item.id > 0) {
    const students = await loadStudentsForCourse(item);
    group.value = item?.group;
    subject.value = item?.subject;
    studentsOfCourse.value = students;
  }
}

function formatCourse(item: Course) {
  return item.id === 0 ? "Neuen Kurs anlegen" : `${item.group?.name} - ${item.subject?.name}`;
}

async function handleRemove() {
  if (selectedCourse.value) {
    await removeCourse(selectedCourse.value, selectedSchoolYear.value!, selectedSemester.value!, () => {
      resetInputs();
      selectedCourse.value = undefined;
    });
  }
}

async function handleAddingStudent() {
  if (student.value) {
    await addStudentToCourse(student.value, selectedCourse.value!);
    await loadCourse(selectedCourse.value);
  }
}

async function handleRemovingStudent() {
  if (selectedStudent.value) {
    await removeStudentFromCourse(selectedStudent.value, selectedCourse.value!);
    await loadCourse(selectedCourse.value);
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

watch([selectedSchoolYear, selectedSemester], async ([currentSchoolYear, currentSemester]) => {
  if (currentSchoolYear && currentSemester) {
    await loadAllCoursesForSchoolYearAndSemester(currentSchoolYear, currentSemester);
    selectedCourse.value = undefined;
    resetInputs();
  }
});

onMounted(async () => {
  if (selectedSchoolYear.value && selectedSemester.value) {
    await loadAllCoursesForSchoolYearAndSemester(selectedSchoolYear.value, selectedSemester.value);
    availableGroups.value = await loadAvailableGroupsForSchoolYear(selectedSchoolYear.value);
    availableSubjects.value = await loadAvailableSubjectsForSchoolYear(selectedSchoolYear.value);
  }
});

const numberOfStudents = computed(() => {
  if (selectedCourse.value && studentsOfCourse.value && studentsOfCourse.value.length > 0) {
    return `${studentsOfCourse.value.length}`;
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
  <management-panel header="Kurse verwalten">
    <template #list>
      <entity-list
        v-model="selectedCourse"
        :entities="courses"
        :format="formatCourse"
      />
    </template>
    <template #edit>
      <p>
        Verwalten Sie hier ihre Kurse. Sie können Kurse anlegen oder bearbeiten, indem Sie den entsprechenden Eintrag in
        der Liste auswählen.
      </p>
      <p-divider />
      <custom-transition>
        <div
          v-show="selectedCourse"
          class="edit-area"
        >
          <div class="group-area">
            <p-card class="shadow-2">
              <template #title> Kurs </template>
              <template #content>
                <object-auto-complete-with-label
                  v-model="group"
                  identifier="groupField"
                  label="Klasse"
                  :items="availableGroups"
                  :option="(group: Group) => group.name!"
                />
                <object-auto-complete-with-label
                  v-model="subject"
                  identifier="subjectField"
                  label="Fach"
                  :items="availableSubjects"
                  :option="(subject: Subject) => subject.name!"
                />
              </template>
            </p-card>
            <save-and-delete-buttons
              :show-delete-when-defined="selectedCourse"
              :save-action="handleSave"
              :delete-action="handleRemove"
              :grid-columns="3"
            />
          </div>
          <div
            v-show="selectedCourse && selectedCourse.id && selectedCourse.id > 0"
            class="students-area"
          >
            <p-card class="shadow-2">
              <template #content>
                <p-data-view
                  :value="studentsOfCourse"
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
                      Schüler zum Kurs hinzufügen
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
