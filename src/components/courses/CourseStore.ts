import type { Course } from "@/components/courses/Course";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import { CourseGateway } from "@/components/courses/CourseGateway";
import { ref } from "vue";
import type { Student } from "@/components/students/Student";

const courseGateway = new CourseGateway();

const courses = ref<Course[]>([]);

async function loadAllCoursesForSchoolYearAndSemester(schoolYear: SchoolYear, semester: Semester) {
  courses.value.length = 0;
  const all = await courseGateway.loadCoursesForSchoolYearAndSemester(schoolYear, semester);
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
  return await courseGateway.loadStudentsForCourse(course);
}

async function loadAvailableGroupsForSchoolYear(schoolYear: SchoolYear) {
  return await courseGateway.loadAvailableGroupsForSchoolYear(schoolYear);
}

async function loadAvailableSubjectsForSchoolYear(schoolYear: SchoolYear) {
  return await courseGateway.loadAvailableSubjectsForSchoolYear(schoolYear);
}

async function addCourse(course: Course, schoolYear: SchoolYear, semester: Semester, cleanup: () => void) {
  await courseGateway.createCourse(course, schoolYear, semester);
  await loadAllCoursesForSchoolYearAndSemester(schoolYear, semester);

  cleanup();
}

async function editCourse(course: Course, schoolYear: SchoolYear, semester: Semester, cleanup: () => void) {
  await courseGateway.updateCourse(course);
  await loadAllCoursesForSchoolYearAndSemester(schoolYear, semester);

  cleanup();
}

async function removeCourse(course: Course, schoolYear: SchoolYear, semester: Semester, cleanup: () => void) {
  await courseGateway.deleteCourseInSchoolYear(course, schoolYear, semester);
  await loadAllCoursesForSchoolYearAndSemester(schoolYear, semester);

  cleanup();
}

async function addStudentToCourse(student: Student, course: Course) {
  await courseGateway.addStudentToCourse(student, course);
}

async function removeStudentFromCourse(student: Student, course: Course) {
  await courseGateway.removeStudentFromCourse(student, course);
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
