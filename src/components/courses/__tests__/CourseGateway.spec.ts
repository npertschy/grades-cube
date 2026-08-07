import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Course } from "@/components/courses/Course";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import {
  loadCoursesBySchoolYearAndSemester,
  loadStudentsByCourse,
  loadAvailableGroupsBySchoolYear,
  loadAvailableSubjectsBySchoolYear,
} from "@/components/courses/CourseGateway";

const { mockedSelect } = vi.hoisted(() => ({
  mockedSelect: vi.fn(),
}));

vi.mock("@/store/Database", () => ({
  db: {
    select: mockedSelect,
    execute: vi.fn(),
  },
}));

const schoolYear: SchoolYear = {
  id: 1,
  start: undefined,
  end: undefined,
  firstSemester: undefined,
  secondSemester: undefined,
};

const semester: Semester = { id: 2, type: 1, start: undefined, end: undefined };

const course: Course = {
  id: 5,
  group: { id: 3, name: "5A", sortingName: "5A", type: 1, students: [] },
  subject: { id: 7, name: "Deutsch" },
  semester,
  schoolYear,
  days: undefined,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("loadCoursesBySchoolYearAndSemester", () => {
  it("returns mapped courses for a school year and semester", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 5, ZDAYS: 3, GROUPID: 3, GROUPNAME: "5A", SUBJECTID: 7, SUBJECTNAME: "Deutsch" },
    ]);

    const result = await loadCoursesBySchoolYearAndSemester(schoolYear, semester);

    expect(mockedSelect).toHaveBeenCalledOnce();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 5,
      days: 3,
      group: { id: 3, name: "5A" },
      subject: { id: 7, name: "Deutsch" },
    });
  });

  it("returns empty array when no courses exist", async () => {
    mockedSelect.mockResolvedValueOnce([]);
    const result = await loadCoursesBySchoolYearAndSemester(schoolYear, semester);
    expect(result).toEqual([]);
  });
});

describe("loadStudentsByCourse", () => {
  it("returns mapped students for a course", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 20, ZFIRSTNAME: "Max", ZLASTNAME: "Muster" },
    ]);

    const result = await loadStudentsByCourse(course);

    expect(mockedSelect).toHaveBeenCalledOnce();
    expect(result).toEqual([
      { id: 20, firstName: "Max", lastName: "Muster", groups: [], courses: [] },
    ]);
  });
});

describe("loadAvailableGroupsBySchoolYear", () => {
  it("returns mapped groups for a school year", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 3, ZNAME: "5A", ZTYPE: 1, ZSORTINGNAME: "5A" },
    ]);

    const result = await loadAvailableGroupsBySchoolYear(schoolYear);

    expect(result).toEqual([
      { id: 3, name: "5A", type: 1, sortingName: "5A", students: [] },
    ]);
  });
});

describe("loadAvailableSubjectsBySchoolYear", () => {
  it("returns mapped subjects for a school year", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 7, ZNAME: "Deutsch" },
    ]);

    const result = await loadAvailableSubjectsBySchoolYear(schoolYear);

    expect(result).toEqual([{ id: 7, name: "Deutsch" }]);
  });
});
