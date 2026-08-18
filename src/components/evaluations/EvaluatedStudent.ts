import type { Student } from "@/components/students/Student";
import type { PerformanceType } from "./Performance";

export type EvaluatedStudent = {
  student: Student;
  grades: Grade[];
};

export type Grade = {
  id: number;
  value: string;
  performanceTitle: string;
  performanceType: PerformanceType;
};
