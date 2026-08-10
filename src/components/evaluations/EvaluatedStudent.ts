import type { Student } from "@/components/students/Student";

export type EvaluatedStudent = {
  student: Student;
  grades: Record<string, Grade>;
};

export type Grade = {
  id: number;
  value: string;
  performanceTitle: string;
  performanceType: number;
};
