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
  await createCourse(course, schoolYear, semester);
  await loadAllCoursesForSchoolYearAndSemester(schoolYear, semester);

  cleanup();
}

async function editCourse(course: Course, schoolYear: SchoolYear, semester: Semester, cleanup: () => void) {
  await updateCourse(course);
  await loadAllCoursesForSchoolYearAndSemester(schoolYear, semester);

  cleanup();
}

async function removeCourse(course: Course, schoolYear: SchoolYear, semester: Semester, cleanup: () => void) {
  await deleteCourseInSchoolYear(course, schoolYear, semester);
  await loadAllCoursesForSchoolYearAndSemester(schoolYear, semester);

  cleanup();
}

async function addStudentToCourse(student: Student, course: Course) {
  await assignStudentToCourse(student, course);
}

async function removeStudentFromCourse(student: Student, course: Course) {
  await unassignStudentFromCourse(student, course);
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
