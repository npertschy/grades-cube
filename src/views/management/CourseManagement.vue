<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import SaveAndDeleteButtons from "@/components/layout/SaveAndDeleteButtons.vue";
import ObjectAutoCompleteWithLabel from "@/components/layout/ObjectAutoCompleteWithLabel.vue";
import ManagementPanel from "@/components/layout/ManagementPanel.vue";
import ContentEditingPanel from "@/components/layout/ContentEditingPanel.vue";
import SchoolYearSelectionContainer from "@/components/schoolYears/SchoolYearSelectionContainer.vue";
import AssignedStudentList from "@/components/layout/AssignedStudentList.vue";
import PDivider from "primevue/divider";
import PRadioButton from "primevue/radiobutton";
import { onMounted, ref, watch } from "vue";
import type { Student } from "@/components/students/Student";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import { useCourses } from "@/components/courses/CourseStore";
import type { Course } from "@/components/courses/Course";
import type { Group } from "@/components/groups/Group";
import type { Subject } from "@/components/subjects/Subject";
import { useUiErrorHandling } from "@/components/errors/ErrorHandling";

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
  formatCourse,
} = useCourses();
const group = ref<Group>();
const subject = ref<Subject>();
const courseLevel = ref<number>(0);
const studentsOfCourse = ref<Student[]>([]);

const { runSafeWithToast, confirmAction } = useUiErrorHandling();

const availableGroups = ref<Group[]>([]);
const availableSubjects = ref<Subject[]>([]);

const selectedCourse = ref<Course | undefined>();

const { selectedSchoolYear, selectedSemester } = useSchoolYearSelection();

onMounted(async () => {
  if (selectedSchoolYear.value && selectedSemester.value) {
    const [_, groups, subjects] = await Promise.all([
      loadAllCoursesForSchoolYearAndSemester(selectedSchoolYear.value, selectedSemester.value),
      loadAvailableGroupsForSchoolYear(selectedSchoolYear.value),
      loadAvailableSubjectsForSchoolYear(selectedSchoolYear.value),
    ]);
    availableGroups.value = groups;
    availableSubjects.value = subjects;
  }
});

async function handleSave() {
  const successMessage = selectedCourse.value?.id ? "Kurs erfolgreich bearbeitet" : "Kurs erfolgreich angelegt";
  await runSafeWithToast(async () => {
    if (selectedCourse.value?.id) {
      const course: Course = {
        id: selectedCourse.value.id,
        group: group.value,
        subject: subject.value,
        schoolYear: selectedCourse.value.schoolYear,
        semester: selectedCourse.value.semester,
        days: selectedCourse.value.days,
        level: selectedCourse.value.level,
        ordinal: selectedCourse.value.ordinal,
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
        level: courseLevel.value,
        ordinal: undefined,
      };

      await addCourse(course, selectedSchoolYear.value!, selectedSemester.value!, () => {
        resetInputs();
        selectedCourse.value = undefined;
      });
    }
  }, successMessage);
}

watch(selectedCourse, (current) => loadCourse(current));

function resetInputs() {
  group.value = undefined;
  subject.value = undefined;
  studentsOfCourse.value = [];
  courseLevel.value = 0;
}

async function loadCourse(item: Course | undefined) {
  resetInputs();
  if (item?.id && item.id > 0) {
    const students = await loadStudentsForCourse(item);
    group.value = item?.group;
    subject.value = item?.subject;
    studentsOfCourse.value = students;
    courseLevel.value = item.level!;
  }
}

function handleRemove() {
  if (!selectedCourse.value) return;
  const course = selectedCourse.value;
  confirmAction(
    "Kurs löschen",
    `Soll "${formatCourse(course)}" wirklich gelöscht werden? Alle zugehörigen Leistungen und Noten werden ebenfalls gelöscht.`,
    "Kurs erfolgreich gelöscht",
    async () => {
      await removeCourse(course, selectedSchoolYear.value!, selectedSemester.value!, () => {
        resetInputs();
        selectedCourse.value = undefined;
      });
    },
  );
}

async function handleAddingStudent(student: Student) {
  await runSafeWithToast(async () => {
    await addStudentToCourse(student, selectedCourse.value!);
    await loadCourse(selectedCourse.value);
  }, `Schüler "${student.firstName} ${student.lastName}" erfolgreich zum Kurs hinzugefügt`);
}

async function handleRemovingStudent(student: Student) {
  confirmAction(
    "Schüler aus Kurs entfernen",
    `Soll "${student.firstName} ${student.lastName}" wirklich aus dem Kurs "${formatCourse(selectedCourse.value!)}" entfernt werden?`,
    `Schüler "${student.firstName} ${student.lastName}" erfolgreich aus dem Kurs entfernt`,
    async () => {
      await removeStudentFromCourse(student, selectedCourse.value!);
      await loadCourse(selectedCourse.value);
    },
  );
}

watch([selectedSchoolYear, selectedSemester], async ([currentSchoolYear, currentSemester]) => {
  if (currentSchoolYear && currentSemester) {
    await loadAllCoursesForSchoolYearAndSemester(currentSchoolYear, currentSemester);
    selectedCourse.value = undefined;
    resetInputs();
  }
});
</script>

<template>
  <school-year-selection-container :selected-school-year="selectedSchoolYear">
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
          Verwalten Sie hier ihre Kurse. Sie können Kurse anlegen oder bearbeiten, indem Sie den entsprechenden Eintrag
          in der Liste auswählen.
        </p>
        <p-divider />
        <custom-transition>
          <div
            v-show="selectedCourse"
            class="edit-area"
          >
            <div class="group-area">
              <content-editing-panel header="Kurs">
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
                  class="mt-2"
                />
                <div
                  v-show="group?.type === 1"
                  class="mt-2"
                  style="display: grid; grid-template-columns: repeat(2, 1fr)"
                >
                  <div>
                    <p-radio-button
                      v-model="courseLevel"
                      input-id="gk"
                      name="level"
                      :value="1"
                    />
                    <label
                      for="gk"
                      class="font-semibold"
                    >
                      GK
                    </label>
                  </div>
                  <div>
                    <p-radio-button
                      v-model="courseLevel"
                      input-id="lk"
                      name="level"
                      :value="2"
                    />
                    <label
                      for="lk"
                      class="font-semibold"
                    >
                      LK
                    </label>
                  </div>
                </div>
                <save-and-delete-buttons
                  :show-delete-when-defined="selectedCourse"
                  :save-action="handleSave"
                  :delete-action="handleRemove"
                  :grid-columns="3"
                />
              </content-editing-panel>
            </div>
            <div
              v-show="selectedCourse && selectedCourse.id && selectedCourse.id > 0"
              class="students-area"
            >
              <assigned-student-list
                :student-list="studentsOfCourse"
                @add-student="handleAddingStudent"
                @remove-student="handleRemovingStudent"
              />
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

.group-area {
  grid-column: 1 / span 4;
}

.students-area {
  grid-column: 5 / span 8;
}
</style>
