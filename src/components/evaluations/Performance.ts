export type Performance = {
  id: number | undefined;
  performanceId: string | undefined;
  title: string;
  editable: boolean;
  weight: number;
  sortOrder: number;
  type: PerformanceType;
  courseId: number;
  date: Date;
};

export const PerformanceType = {
    ORAL: 0,
    ORAL_SUGGESTION: 1,
    ORAL_OVERALL: 2,
    SPECIAL: 3,
    SPECIAL_OVERALL: 4,
    AT_OVERALL: 5,
    WRITTEN: 6,
    WRITTEN_OVERALL: 7,
    OVERALL: 8,
} as const;

export type PerformanceType = (typeof PerformanceType)[keyof typeof PerformanceType];
