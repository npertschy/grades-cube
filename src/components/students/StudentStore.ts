import { ref } from "vue";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import { StudentGateway } from "@/components/students/StudentGateway";
import type { Student } from "@/components/students/Student";

const studentGateway = new StudentGateway();

const students = ref<Student[]>([]);

async function loadStudentsForSchoolYear(schoolYear: SchoolYear) {
  students.value.length = 0;

  const all = await studentGateway.loadAllStudentsForSchoolYear(schoolYear);
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

async function loadGroupsAndCoursesFor(
  student: Student,
  schoolYear: SchoolYear,
  semester: Semester,
) {
  return await studentGateway.loadGroupsAndCoursesForStudent(
    student,
    schoolYear,
    semester,
  );
}

async function addStudent(
  studentToAdd: Student,
  schoolYear: SchoolYear,
  cleanup: () => void,
) {
  await studentGateway.createStudentInSchoolYear(studentToAdd, schoolYear);
  await loadStudentsForSchoolYear(schoolYear);

  cleanup();
}

function formatStudent(item: Student) {
  return item.id === 0
    ? "Neuen Schüler anlegen"
    : item.firstName + " " + item.lastName;
}

async function removeStudent(
  student: Student,
  schoolYear: SchoolYear,
  cleanup: () => void,
) {
  await studentGateway.deleteStudentInSchoolYear(student, schoolYear);
  await loadStudentsForSchoolYear(schoolYear);

  cleanup();
}

async function loadGroupsForSchoolYear(schoolYear: SchoolYear) {
  return studentGateway.loadGroupsForSchoolYear(schoolYear);
}

function loadCoursesForSchoolYearAndSemester(
  schoolYear: SchoolYear,
  semester: Semester,
) {
  return studentGateway.loadCoursesForSchoolYearAndSemester(
    schoolYear,
    semester,
  );
}

export function useStudents() {
  return {
    students,
    loadStudentsForSchoolYear,
    loadGroupsAndCoursesFor,
    addStudent,
    formatStudent,
    removeStudent,
    loadGroupsForSchoolYear,
    loadCoursesForSchoolYearAndSemester,
  };
}
