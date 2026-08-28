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
import { useStoreErrorHandling } from "../errors/ErrorHandling";

const { runSafeWithThrow } = useStoreErrorHandling();

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
      level: undefined,
      ordinal: undefined,
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
  await runSafeWithThrow(async () => {
    await createCourse(course, schoolYear, semester);
    await loadAllCoursesForSchoolYearAndSemester(schoolYear, semester);
    cleanup();
  }, "Kurs konnte nicht gespeichert werden.");
}

async function editCourse(course: Course, schoolYear: SchoolYear, semester: Semester, cleanup: () => void) {
  await runSafeWithThrow(async () => {
    await updateCourse(course);
    await loadAllCoursesForSchoolYearAndSemester(schoolYear, semester);
    cleanup();
  }, "Kurs konnte nicht aktualisiert werden.");
}

async function removeCourse(course: Course, schoolYear: SchoolYear, semester: Semester, cleanup: () => void) {
  await runSafeWithThrow(async () => {
    await deleteCourseInSchoolYear(course);
    await loadAllCoursesForSchoolYearAndSemester(schoolYear, semester);
    cleanup();
  }, "Kurs konnte nicht gelöscht werden.");
}

async function addStudentToCourse(student: Student, course: Course) {
  await runSafeWithThrow(async () => {
    await assignStudentToCourse(student, course);
  }, "Schüler konnte nicht zum Kurs hinzugefügt werden.");
}

async function removeStudentFromCourse(student: Student, course: Course) {
  await runSafeWithThrow(async () => {
    await unassignStudentFromCourse(student, course);
  }, "Schüler konnte nicht aus dem Kurs entfernt werden.");
}

function formatCourse(course: Course): string {
    if (course.id === 0) {
        return "Neuen Kurs anlegen";
    }

    if (course.group?.type === 0) {
        return `${course.group?.name} - ${course.subject?.name}`;
    } else {
        const level = course.level === 1 ? "GK" : "LK";
        return `${level} ${course.ordinal} - ${course.subject?.name}`;
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
    formatCourse,
  };
}
