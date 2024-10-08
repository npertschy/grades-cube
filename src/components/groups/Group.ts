import type { Student } from "@/components/students/Student";

export type Group = {
  id: number | undefined;
  name: string | undefined;
  sortingName: string | undefined;
  type: number | undefined;
  students: Student[] | undefined;
};
