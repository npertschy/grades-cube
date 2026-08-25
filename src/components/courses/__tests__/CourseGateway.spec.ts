import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Course } from "@/components/courses/Course";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import type { Student } from "@/components/students/Student";
import {
  loadCoursesBySchoolYearAndSemester,
  loadStudentsByCourse,
  loadAvailableGroupsBySchoolYear,
  loadAvailableSubjectsBySchoolYear,
  createCourse,
  updateCourse,
  deleteCourseInSchoolYear,
  assignStudentToCourse,
  unassignStudentFromCourse,
} from "@/components/courses/CourseGateway";
import { Z_ENT } from "@/store/EntityId";

const { mockedSelect, mockedExecute, mockedNextPrimaryKey, mockedInsertDefaultPerformances } = vi.hoisted(() => ({
  mockedSelect: vi.fn(),
  mockedExecute: vi.fn(),
  mockedNextPrimaryKey: vi.fn(),
  mockedInsertDefaultPerformances: vi.fn(),
}));

vi.mock("@/store/Database", () => ({
  db: {
    select: mockedSelect,
    execute: mockedExecute,
  },
  nextPrimaryKey: mockedNextPrimaryKey,
  withTransaction: async (fn: () => Promise<unknown>) => fn(),
}));

vi.mock("@/components/courses/DefaultPerformances", () => ({
  insertDefaultPerformancesWithGrades: mockedInsertDefaultPerformances,
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
  days: {},
};

const student: Student = { id: 20, firstName: "Max", lastName: "Muster", groups: [], courses: [] };

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
      days: {},
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

describe("createCourse", () => {
  it("inserts a course and calls insertDefaultPerformancesWithGrades inside a transaction", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(99);
    mockedExecute.mockResolvedValue({});
    mockedInsertDefaultPerformances.mockResolvedValue(undefined);

    await createCourse(course, schoolYear, semester);

    expect(mockedNextPrimaryKey).toHaveBeenCalledWith(Z_ENT.ZCOURSE);
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ZCOURSE"),
      [99, Z_ENT.ZCOURSE, 1, 3, 7, 2, 1, {}],
    );
    expect(mockedInsertDefaultPerformances).toHaveBeenCalledWith(99, 1, []);
  });

  it("rethrows when insertDefaultPerformancesWithGrades fails", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(99);
    mockedExecute.mockResolvedValue({});
    mockedInsertDefaultPerformances.mockRejectedValueOnce(new Error("constraint"));

    await expect(createCourse(course, schoolYear, semester)).rejects.toThrow("constraint");
  });

  it("rethrows when ZCOURSE insert fails", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(99);
    mockedExecute.mockRejectedValueOnce(new Error("constraint"));
    mockedExecute.mockResolvedValue({});

    await expect(createCourse(course, schoolYear, semester)).rejects.toThrow("constraint");
  });
});

describe("updateCourse", () => {
  it("updates group, subject, days, and increments Z_OPT", async () => {
    mockedExecute.mockResolvedValueOnce({});

    await updateCourse(course);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("Z_OPT = Z_OPT + 1"),
      [3, 7, {}, 5],
    );
  });
});

describe("deleteCourseInSchoolYear", () => {
  it("deletes grades, performances, student assignments and the course inside a transaction", async () => {
    mockedExecute.mockResolvedValue({});

    await deleteCourseInSchoolYear(course);

    const calls = mockedExecute.mock.calls.map((c) => c[0] as string);
    expect(calls.some((s) => s.includes("DELETE FROM ZGRADE"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM ZPERFORMANCE"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM Z_1STUDENTS"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM ZCOURSE"))).toBe(true);
  });

  it("rethrows on error", async () => {
    mockedExecute.mockResolvedValueOnce({});
    mockedExecute.mockRejectedValueOnce(new Error("db error"));
    mockedExecute.mockResolvedValue({});

    await expect(deleteCourseInSchoolYear(course)).rejects.toThrow("db error");
  });
});

describe("assignStudentToCourse", () => {
  it("inserts the student-course mapping and creates blank grade rows for each existing performance", async () => {
    mockedExecute.mockResolvedValue({});
    mockedSelect.mockResolvedValueOnce([{ Z_PK: 11 }, { Z_PK: 12 }]);
    mockedNextPrimaryKey.mockResolvedValueOnce(201);
    mockedNextPrimaryKey.mockResolvedValueOnce(202);

    await assignStudentToCourse(student, course);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT OR IGNORE INTO Z_1STUDENTS"),
      [5, 20],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT OR IGNORE INTO Z_3STUDENTS"),
      [5, 20],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ZGRADE"),
      [201, Z_ENT.ZGRADE, 1, 11, 20],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ZGRADE"),
      [202, Z_ENT.ZGRADE, 1, 12, 20],
    );
  });

  it("adds the course mapping and the group link but no grades when the course has no performances", async () => {
    mockedExecute.mockResolvedValue({});
    mockedSelect.mockResolvedValueOnce([]);

    await assignStudentToCourse(student, course);

    const calls = mockedExecute.mock.calls.map((c) => c[0] as string);
    expect(calls.some((s) => s.includes("INSERT OR IGNORE INTO Z_1STUDENTS"))).toBe(true);
    expect(calls.some((s) => s.includes("INSERT OR IGNORE INTO Z_3STUDENTS"))).toBe(true);
    expect(calls.some((s) => s.includes("INSERT INTO ZGRADE"))).toBe(false);
  });
});

describe("unassignStudentFromCourse", () => {
  it("deletes the student's grades and the student-course mapping inside a transaction", async () => {
    mockedExecute.mockResolvedValue({});

    await unassignStudentFromCourse(student, course);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM ZGRADE"),
      [20, 5],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM Z_1STUDENTS"),
      [5, 20],
    );
  });
});
