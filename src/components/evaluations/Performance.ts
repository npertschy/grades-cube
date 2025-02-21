export type Performance = {
  id: number | undefined;
  performanceId: string | undefined;
  title: string;
  editable: boolean;
  weight: number;
  sortOrder: number;
  type: number;
  courseId: number;
  date: Date;
};
