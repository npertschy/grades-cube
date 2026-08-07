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
import type { Student } from "@/components/students/Student";

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
  await createStudentInSchoolYear(studentToAdd, schoolYear);
  await loadStudentsForSchoolYear(schoolYear);

  cleanup();
}

async function editStudent(student: Student, schoolYear: SchoolYear, cleanup: () => void) {
  await updateStudent(student);
  await loadStudentsForSchoolYear(schoolYear);

  cleanup();
}

function formatStudent(item: Student) {
  return item.id === 0 ? "Neuen Schüler anlegen" : item.firstName + " " + item.lastName;
}

async function removeStudent(student: Student, schoolYear: SchoolYear, cleanup: () => void) {
  await deleteStudentInSchoolYear(student, schoolYear);
  await loadStudentsForSchoolYear(schoolYear);

  cleanup();
}

async function loadGroupsForSchoolYear(schoolYear: SchoolYear) {
  return await loadGroupsBySchoolYear(schoolYear);
}

async function loadCoursesForSchoolYearAndSemester(schoolYear: SchoolYear, semester: Semester) {
  return await loadCoursesBySchoolYearAndSemester(schoolYear, semester);
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
  };
}
