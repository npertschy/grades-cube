import type { Course } from "@/components/courses/Course";
import type { Group } from "@/components/groups/Group";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Student } from "@/components/students/Student";

export type MigrationGroupSelection = {
  group: Group;
  newName: string;
  selected: boolean;
  students: { student: Student; included: boolean }[];
};

export type MigrationCoursePreview = {
  course: Course;
  newGroupName: string;
  targetSemesterType: 1 | 2;
  students: Student[];
};

export type SchoolYearMigrationPlan = {
  sourceYear: SchoolYear;
  targetYear: SchoolYear;
  groups: MigrationGroupSelection[];
};
