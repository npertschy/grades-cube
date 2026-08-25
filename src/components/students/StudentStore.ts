import { ref } from "vue";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import {
  createStudentInSchoolYear,
  deleteStudentInSchoolYear,
  loadAllStudentsForSchoolYear,
  loadCoursesBySchoolYearAndSemester,
  loadGroupsAndCoursesForStudent,
  loadGroupsBySchoolYear,
  updateStudent,
} from "@/components/students/StudentGateway";
import { assignStudentToGroup, unassignStudentFromGroup } from "@/components/groups/GroupGateway";
import { assignStudentToCourse, unassignStudentFromCourse } from "@/components/courses/CourseGateway";
import type { Student } from "@/components/students/Student";
import type { Group } from "@/components/groups/Group";
import type { Course } from "@/components/courses/Course";
import { useStoreErrorHandling } from "../errors/ErrorHandling";

const { runSafeWithThrow } = useStoreErrorHandling();

const students = ref<Student[]>([]);

async function loadStudentsForSchoolYear(schoolYear: SchoolYear) {
  students.value.length = 0;

  const all = await loadAllStudentsForSchoolYear(schoolYear);
  students.value.push(
    {
      id: 0,
      firstName: undefined,
      lastName: undefined,
      groups: undefined,
      courses: undefined,
    },
    ...all,
  );
}

async function loadGroupsAndCoursesFor(student: Student, schoolYear: SchoolYear, semester: Semester) {
  return await loadGroupsAndCoursesForStudent(student, schoolYear, semester);
}

async function addStudent(studentToAdd: Student, schoolYear: SchoolYear, cleanup: () => void) {
  await runSafeWithThrow(async () => {
    await createStudentInSchoolYear(studentToAdd, schoolYear);
    await loadStudentsForSchoolYear(schoolYear);
    cleanup();
  }, "Schüler konnte nicht gespeichert werden.");
}

async function editStudent(student: Student, schoolYear: SchoolYear, cleanup: () => void) {
  await runSafeWithThrow(async () => {
    await updateStudent(student);
    await loadStudentsForSchoolYear(schoolYear);
    cleanup();
  }, "Schüler konnte nicht aktualisiert werden.");
}

function formatStudent(item: Student) {
  return item.id === 0 ? "Neuen Schüler anlegen" : item.firstName + " " + item.lastName;
}

async function removeStudent(student: Student, schoolYear: SchoolYear, cleanup: () => void) {
  await runSafeWithThrow(async () => {
    await deleteStudentInSchoolYear(student, schoolYear);
    await loadStudentsForSchoolYear(schoolYear);
    cleanup();
  }, "Schüler konnte nicht gelöscht werden.");
}

async function loadGroupsForSchoolYear(schoolYear: SchoolYear) {
  return await loadGroupsBySchoolYear(schoolYear);
}

async function loadCoursesForSchoolYearAndSemester(schoolYear: SchoolYear, semester: Semester) {
  return await loadCoursesBySchoolYearAndSemester(schoolYear, semester);
}

async function addGroupToStudent(student: Student, group: Group) {
  await runSafeWithThrow(async () => {
    await assignStudentToGroup(student, group);
  }, "Schüler konnte nicht zur Klasse hinzugefügt werden.");
}

async function removeGroupFromStudent(student: Student, group: Group) {
  await runSafeWithThrow(async () => {
    await unassignStudentFromGroup(student, group);
  }, "Schüler konnte nicht aus der Klasse entfernt werden.");
}

async function addCourseToStudent(student: Student, course: Course) {
  await runSafeWithThrow(async () => {
    await assignStudentToCourse(student, course);
  }, "Schüler konnte nicht zum Kurs hinzugefügt werden.");
}

async function removeCourseFromStudent(student: Student, course: Course) {
  await runSafeWithThrow(async () => {
    await unassignStudentFromCourse(student, course);
  }, "Schüler konnte nicht aus dem Kurs entfernt werden.");
}

export function useStudents() {
  return {
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
  };
}
