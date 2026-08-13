import type { Course } from "@/components/courses/Course";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import {
  assignStudentToCourse,
  createCourse,
  deleteCourseInSchoolYear,
  loadAvailableGroupsBySchoolYear,
  loadAvailableSubjectsBySchoolYear,
  loadCoursesBySchoolYearAndSemester,
  loadStudentsByCourse,
  unassignStudentFromCourse,
  updateCourse,
} from "@/components/courses/CourseGateway";
import { ref } from "vue";
import type { Student } from "@/components/students/Student";

const courses = ref<Course[]>([]);

async function loadAllCoursesForSchoolYearAndSemester(schoolYear: SchoolYear, semester: Semester) {
  courses.value.length = 0;
  const all = await loadCoursesBySchoolYearAndSemester(schoolYear, semester);
  courses.value.push(
    {
      id: 0,
      group: undefined,
      subject: undefined,
      semester: undefined,
      schoolYear: undefined,
      days: undefined,
    },
    ...all,
  );
}

async function loadStudentsForCourse(course: Course): Promise<Student[]> {
  return await loadStudentsByCourse(course);
}

async function loadAvailableGroupsForSchoolYear(schoolYear: SchoolYear) {
  return await loadAvailableGroupsBySchoolYear(schoolYear);
}

async function loadAvailableSubjectsForSchoolYear(schoolYear: SchoolYear) {
  return await loadAvailableSubjectsBySchoolYear(schoolYear);
}

async function addCourse(course: Course, schoolYear: SchoolYear, semester: Semester, cleanup: () => void) {
  try {
    await createCourse(course, schoolYear, semester);
    await loadAllCoursesForSchoolYearAndSemester(schoolYear, semester);
    cleanup();
  } catch (e) {
    throw new Error("Kurs konnte nicht gespeichert werden.", { cause: e });
  }
}

async function editCourse(course: Course, schoolYear: SchoolYear, semester: Semester, cleanup: () => void) {
  try {
    await updateCourse(course);
    await loadAllCoursesForSchoolYearAndSemester(schoolYear, semester);
    cleanup();
  } catch (e) {
    throw new Error("Kurs konnte nicht aktualisiert werden.", { cause: e });
  }
}

async function removeCourse(course: Course, schoolYear: SchoolYear, semester: Semester, cleanup: () => void) {
  try {
    await deleteCourseInSchoolYear(course);
    await loadAllCoursesForSchoolYearAndSemester(schoolYear, semester);
    cleanup();
  } catch (e) {
    throw new Error("Kurs konnte nicht gelöscht werden.", { cause: e });
  }
}

async function addStudentToCourse(student: Student, course: Course) {
  try {
    await assignStudentToCourse(student, course);
  } catch (e) {
    throw new Error("Schüler konnte nicht zum Kurs hinzugefügt werden.", { cause: e });
  }
}

async function removeStudentFromCourse(student: Student, course: Course) {
  try {
    await unassignStudentFromCourse(student, course);
  } catch (e) {
    throw new Error("Schüler konnte nicht aus dem Kurs entfernt werden.", { cause: e });
  }
}

export function useCourses() {
  return {
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
  };
}
