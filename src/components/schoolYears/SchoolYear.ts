import type { Semester } from "./Semester";

export type SchoolYear = {
  id: number | undefined;
  start: Date | undefined;
  end: Date | undefined;
  firstSemester: Semester | undefined;
  secondSemester: Semester | undefined;
};
