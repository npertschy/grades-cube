import type { Student } from "@/components/students/Student";

export type Group = {
    id: number | undefined;
    name: string | undefined;
    students: Student[] | undefined;
};
