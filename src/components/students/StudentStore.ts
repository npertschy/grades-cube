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
  try {
    await createStudentInSchoolYear(studentToAdd, schoolYear);
    await loadStudentsForSchoolYear(schoolYear);
    cleanup();
  } catch (e) {
    throw new Error("Schüler konnte nicht gespeichert werden.", { cause: e });
  }
}

async function editStudent(student: Student, schoolYear: SchoolYear, cleanup: () => void) {
  try {
    await updateStudent(student);
    await loadStudentsForSchoolYear(schoolYear);
    cleanup();
  } catch (e) {
    throw new Error("Schüler konnte nicht aktualisiert werden.", { cause: e });
  }
}

function formatStudent(item: Student) {
  return item.id === 0 ? "Neuen Schüler anlegen" : item.firstName + " " + item.lastName;
}

async function removeStudent(student: Student, schoolYear: SchoolYear, cleanup: () => void) {
  try {
    await deleteStudentInSchoolYear(student, schoolYear);
    await loadStudentsForSchoolYear(schoolYear);
    cleanup();
  } catch (e) {
    throw new Error("Schüler konnte nicht gelöscht werden.", { cause: e });
  }
}

async function loadGroupsForSchoolYear(schoolYear: SchoolYear) {
  return await loadGroupsBySchoolYear(schoolYear);
}

async function loadCoursesForSchoolYearAndSemester(schoolYear: SchoolYear, semester: Semester) {
  return await loadCoursesBySchoolYearAndSemester(schoolYear, semester);
}

async function addGroupToStudent(student: Student, group: Group) {
  try {
    await assignStudentToGroup(student, group);
  } catch (e) {
    throw new Error("Schüler konnte nicht zur Klasse hinzugefügt werden.", { cause: e });
  }
}

async function removeGroupFromStudent(student: Student, group: Group) {
  try {
    await unassignStudentFromGroup(student, group);
  } catch (e) {
    throw new Error("Schüler konnte nicht aus der Klasse entfernt werden.", { cause: e });
  }
}

async function addCourseToStudent(student: Student, course: Course) {
  try {
    await assignStudentToCourse(student, course);
  } catch (e) {
    throw new Error("Schüler konnte nicht zum Kurs hinzugefügt werden.", { cause: e });
  }
}

async function removeCourseFromStudent(student: Student, course: Course) {
  try {
    await unassignStudentFromCourse(student, course);
  } catch (e) {
    throw new Error("Schüler konnte nicht aus dem Kurs entfernt werden.", { cause: e });
  }
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
