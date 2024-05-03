import { ref } from "vue";
import type { Student } from "./Student";
import { StudentGateway } from "@/components/students/StudentGateway";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";

const studentGateway = new StudentGateway();

const students = ref<Student[]>([]);

async function loadStudentsForSchoolYear(schoolYear: SchoolYear) {
  students.value.length = 0;

  const all = await studentGateway.loadAllStudentsForSchoolYear(schoolYear);
  students.value.push(
    {
      id: 0,
      firstName: undefined,
      lastName: undefined
    },
    ...all);
}

async function addStudent(studentToAdd: Student, schoolYear: SchoolYear, cleanup: () => void) {
  await studentGateway.createStudentInSchoolYear(studentToAdd, schoolYear);
  await loadStudentsForSchoolYear(schoolYear);

  cleanup();
}

function formatStudent(item: Student) {
  return item.id === 0
    ? "Neuen Schüler anlegen"
    : item.firstName + " " + item.lastName;
}

async function removeStudent(student: Student, schoolYear: SchoolYear, cleanup: () => void) {
  await studentGateway.deleteStudentInSchoolYear(student, schoolYear);
  await loadStudentsForSchoolYear(schoolYear);

  cleanup();
}

export function useStudents() {
  return {
    students,
    loadStudentsForSchoolYear,
    addStudent,
    formatStudent,
    removeStudent,
  };
}
