import { useGroups } from "@/components/groups/GroupStore";
import type {
  MigrationCoursePreview,
  MigrationGroupSelection,
  SchoolYearMigrationPlan,
} from "@/components/schoolYears/Migration";
import {
  loadMigratableCourses,
  loadMigratableGroups,
  loadMigrationStudents,
  migrateSchoolYear,
} from "@/components/schoolYears/MigrationGateway";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Student } from "@/components/students/Student";
import { useStudents } from "@/components/students/StudentStore";
import { useSubjects } from "@/components/subjects/SubjectStore";
import { useStoreErrorHandling } from "@/components/errors/ErrorHandling";
import { ref } from "vue";

const { runSafeWithThrow } = useStoreErrorHandling();
const groups = ref<MigrationGroupSelection[]>([]);
const availableStudents = ref<Student[]>([]);
const coursePreviews = ref<MigrationCoursePreview[]>([]);
const sourceYear = ref<SchoolYear>();
const targetYear = ref<SchoolYear>();

function findGroup(groupId: number | undefined): MigrationGroupSelection | undefined {
  return groups.value.find((selection) => selection.group.id === groupId);
}

async function startMigration(source: SchoolYear, target: SchoolYear): Promise<void> {
  cancelMigration();
  sourceYear.value = source;
  targetYear.value = target;
  const [migratableGroups, students] = await Promise.all([
    loadMigratableGroups(source),
    loadMigrationStudents(),
  ]);
  availableStudents.value = students;
  groups.value = migratableGroups.map((group) => ({
    group,
    newName: group.name ?? "",
    selected: false,
    students: (group.students ?? []).map((student) => ({ student, included: true })),
  }));
}

function toggleGroupSelected(groupId: number | undefined): void {
  const selection = findGroup(groupId);
  if (selection) selection.selected = !selection.selected;
}

function toggleStudentIncluded(groupId: number | undefined, studentId: number | undefined): void {
  const studentSelection = findGroup(groupId)?.students.find((item) => item.student.id === studentId);
  if (studentSelection) studentSelection.included = !studentSelection.included;
}

function renameGroup(groupId: number | undefined, newName: string): void {
  const selection = findGroup(groupId);
  if (selection) selection.newName = newName;
}

function addStudentToGroup(groupId: number | undefined, student: Student): void {
  const selection = findGroup(groupId);
  if (!selection) return;
  const existing = selection.students.find((item) => item.student.id === student.id);
  if (existing) {
    existing.included = true;
  } else {
    selection.students.push({ student, included: true });
  }
}

async function buildCoursePreviews(): Promise<MigrationCoursePreview[]> {
  if (!sourceYear.value) return [];
  const selectedGroups = groups.value.filter((selection) => selection.selected);
  if (selectedGroups.length === 0) {
    coursePreviews.value = [];
    return [];
  }
  const courses = await loadMigratableCourses(
    sourceYear.value,
    selectedGroups.map((selection) => selection.group.id!),
  );
  coursePreviews.value = courses.map((course) => {
    const selection = selectedGroups.find((item) => item.group.id === course.group?.id)!;
    return {
      course: { ...course, group: { ...course.group!, name: selection.newName } },
      newGroupName: selection.newName,
      targetSemesterType: course.semester?.type as 1 | 2,
      students: selection.students.filter((item) => item.included).map((item) => item.student),
    };
  });
  return coursePreviews.value;
}

async function confirmMigration(): Promise<void> {
  if (!sourceYear.value || !targetYear.value) return;
  const target = targetYear.value;
  const plan: SchoolYearMigrationPlan = {
    sourceYear: sourceYear.value,
    targetYear: target,
    groups: groups.value,
  };

  await runSafeWithThrow(async () => {
    await migrateSchoolYear(plan);
    await Promise.all([
      useGroups().loadAllGroupsForSchoolYearAndSemester(target),
      useStudents().loadStudentsForSchoolYear(target),
      useSubjects().loadSubjectsForSchoolYear(target),
    ]);
    cancelMigration();
  }, "Schuljahr konnte nicht migriert werden.");
}

function cancelMigration(): void {
  groups.value = [];
  availableStudents.value = [];
  coursePreviews.value = [];
  sourceYear.value = undefined;
  targetYear.value = undefined;
}

export function useMigration() {
  return {
    groups,
    availableStudents,
    coursePreviews,
    sourceYear,
    targetYear,
    startMigration,
    toggleGroupSelected,
    toggleStudentIncluded,
    renameGroup,
    addStudentToGroup,
    buildCoursePreviews,
    confirmMigration,
    cancelMigration,
  };
}
