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
import { onMounted, ref, watch } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import type { Student } from "@/components/students/Student";
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
const group = ref<Group>();
const subject = ref<Subject>();
const studentsOfCourse = ref<Student[]>([]);

const toast = useToast();
const confirm = useConfirm();

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
  try {
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
  } catch (e) {
    toast.add({ severity: "error", summary: "Fehler", detail: (e as Error).message, life: 5000 });
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

function handleRemove() {
  if (!selectedCourse.value) return;
  const course = selectedCourse.value;
  confirm.require({
    message: `Soll "${formatCourse(course)}" wirklich gelöscht werden? Alle zugehörigen Leistungen und Noten werden ebenfalls gelöscht.`,
    header: "Kurs löschen",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Abbrechen", severity: "secondary", outlined: true },
    acceptProps: { label: "Löschen", severity: "danger" },
    accept: async () => {
      try {
        await removeCourse(course, selectedSchoolYear.value!, selectedSemester.value!, () => {
          resetInputs();
          selectedCourse.value = undefined;
        });
      } catch (e) {
        toast.add({ severity: "error", summary: "Fehler", detail: (e as Error).message, life: 5000 });
      }
    },
  });
}

async function handleAddingStudent() {
  if (student.value) {
    try {
      await addStudentToCourse(student.value, selectedCourse.value!);
      await loadCourse(selectedCourse.value);
    } catch (e) {
      toast.add({ severity: "error", summary: "Fehler", detail: (e as Error).message, life: 5000 });
    }
  }
}

async function handleRemovingStudent() {
  if (selectedStudent.value) {
    try {
      await removeStudentFromCourse(selectedStudent.value, selectedCourse.value!);
      await loadCourse(selectedCourse.value);
    } catch (e) {
      toast.add({ severity: "error", summary: "Fehler", detail: (e as Error).message, life: 5000 });
    }
  }
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

.label-over-input {
  display: grid;
  grid-template-columns: auto;
}

.highlight-button {
  background-color: var(--p-highlight-focus-background);
  color: var(--p-highlight-color);
}
</style>
