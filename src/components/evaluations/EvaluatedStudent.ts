import type { Student } from "@/components/students/Student";

export type EvaluatedStudent = {
  student: Student;
  grades: Map<string, Grade>;
};

export type Grade = {
  id: number;
  value: string;
  performacneTitle: string;
  performanceType: number;
};
