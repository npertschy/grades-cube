import { ref } from "vue";
import type { Student } from "./Student";
import { StudentGateway } from "@/components/students/StudentGateway";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";

const studentGateway = new StudentGateway();

const students = ref<Student[]>([]);

async function loadStudentsForSchoolYear(schoolYear: SchoolYear, semester: Semester) {
  students.value.length = 0;

  const all = await studentGateway.loadAllStudentsForSchoolYear(schoolYear, semester);
  students.value.push(
    {
      id: 0,
      firstName: undefined,
      lastName: undefined,
      groups: undefined,
      courses: undefined
    },
    ...all);
}

async function loadGroupsAndCoursesFor(student: Student, schoolYear: SchoolYear, semester: Semester) {
  return studentGateway.loadGroupsAndCoursesForStudent(student, schoolYear, semester);
}

async function addStudent(studentToAdd: Student, schoolYear: SchoolYear, semester: Semester, cleanup: () => void) {
  await studentGateway.createStudentInSchoolYear(studentToAdd, schoolYear);
  await loadStudentsForSchoolYear(schoolYear, semester);

  cleanup();
}

function formatStudent(item: Student) {
  return item.id === 0
    ? "Neuen Schüler anlegen"
    : item.firstName + " " + item.lastName;
}

async function removeStudent(student: Student, schoolYear: SchoolYear, semester: Semester, cleanup: () => void) {
  await studentGateway.deleteStudentInSchoolYear(student, schoolYear);
  await loadStudentsForSchoolYear(schoolYear, semester);

  cleanup();
}

export function useStudents() {
  return {
    students,
    loadStudentsForSchoolYear,
    loadGroupsAndCoursesFor,
    addStudent,
    formatStudent,
    removeStudent,
  };
}
