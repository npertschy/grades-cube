import type { Course } from "@/components/courses/Course";
import type { Group } from "@/components/groups/Group";

export type Student = {
  id: number | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  groups: Group[] | undefined;
  courses: Course[] | undefined;
};
