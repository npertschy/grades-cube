import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import type { Student } from "@/components/students/Student";
import {
  loadAllStudentsForSchoolYear,
  loadGroupsAndCoursesForStudent,
  createStudentInSchoolYear,
  updateStudent,
  deleteStudentInSchoolYear,
  loadGroupsBySchoolYear,
  loadCoursesBySchoolYearAndSemester,
} from "@/components/students/StudentGateway";
import { Z_ENT } from "@/store/EntityId";

const { mockedSelect, mockedExecute, mockedNextPrimaryKey } = vi.hoisted(() => ({
  mockedSelect: vi.fn(),
  mockedExecute: vi.fn(),
  mockedNextPrimaryKey: vi.fn(),
}));

vi.mock("@/store/Database", () => ({
  db: {
    select: mockedSelect,
    execute: mockedExecute,
  },
  nextPrimaryKey: mockedNextPrimaryKey,
  withTransaction: async (fn: () => Promise<unknown>) => fn(),
}));

const schoolYear: SchoolYear = {
  id: 1,
  start: undefined,
  end: undefined,
  firstSemester: undefined,
  secondSemester: undefined,
};

const semester: Semester = { id: 2, type: 1, start: undefined, end: undefined };
const student: Student = { id: 10, firstName: "Max", lastName: "Muster", groups: [], courses: [] };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("loadAllStudentsForSchoolYear", () => {
  it("returns mapped students for a school year", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 10, ZFIRSTNAME: "Max", ZLASTNAME: "Muster" },
    ]);

    const result = await loadAllStudentsForSchoolYear(schoolYear);

    expect(mockedSelect).toHaveBeenCalledOnce();
    expect(result).toEqual([
      { id: 10, firstName: "Max", lastName: "Muster", groups: undefined, courses: undefined },
    ]);
  });

  it("returns empty array when no students exist", async () => {
    mockedSelect.mockResolvedValueOnce([]);
    const result = await loadAllStudentsForSchoolYear(schoolYear);
    expect(result).toEqual([]);
  });
});

describe("loadGroupsAndCoursesForStudent", () => {
  it("returns student with groups and courses populated", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 5, ZNAME: "5A", ZSORTINGNAME: "5A", ZTYPE: 1 },
    ]);
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 7, ZSUBJECT: 3, ZGROUP: 5, GROUPNAME: "5A", SUBJECTNAME: "Deutsch" },
    ]);

    const result = await loadGroupsAndCoursesForStudent(student, schoolYear, semester);

    expect(result.id).toBe(10);
    expect(result.groups).toHaveLength(1);
    expect(result.groups![0]).toMatchObject({ id: 5, name: "5A" });
    expect(result.courses).toHaveLength(1);
    expect(result.courses![0]).toMatchObject({ id: 7, subject: { id: 3, name: "Deutsch" } });
  });
});

describe("createStudentInSchoolYear", () => {
  it("inserts the student with nextPrimaryKey and school year mapping inside a transaction", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(42);
    mockedExecute.mockResolvedValue({});

    await createStudentInSchoolYear(student, schoolYear);

    expect(mockedNextPrimaryKey).toHaveBeenCalledWith(Z_ENT.ZSTUDENT);
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ZSTUDENT"),
      [42, 6, 1, "Max", "Muster"],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO Z_6YEARS"),
      [42, 1],
    );
  });
});

describe("updateStudent", () => {
  it("updates first and last name and increments Z_OPT", async () => {
    mockedExecute.mockResolvedValueOnce({});

    await updateStudent(student);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("Z_OPT = Z_OPT + 1"),
      ["Max", "Muster", 10],
    );
  });
});

describe("deleteStudentInSchoolYear", () => {
  it("deletes only the year mapping when the student still belongs to other years", async () => {
    mockedExecute.mockResolvedValue({});
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 1 }]);

    await deleteStudentInSchoolYear(student, schoolYear);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM Z_6YEARS"),
      [10, 1],
    );
    expect(mockedExecute).not.toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM ZSTUDENT"),
      expect.anything(),
    );
  });

  it("also deletes the student record when no year mappings remain", async () => {
    mockedExecute.mockResolvedValue({});
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 0 }]);

    await deleteStudentInSchoolYear(student, schoolYear);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM ZSTUDENT"),
      [10],
    );
  });
});

describe("loadGroupsBySchoolYear", () => {
  it("returns mapped groups for a school year", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 5, ZNAME: "5A", ZSORTINGNAME: "5A", ZTYPE: 1 },
    ]);

    const result = await loadGroupsBySchoolYear(schoolYear);

    expect(mockedSelect).toHaveBeenCalledOnce();
    expect(result).toEqual([{ id: 5, name: "5A", sortingName: "5A", students: [], type: 1 }]);
  });

  it("returns empty array when no groups exist", async () => {
    mockedSelect.mockResolvedValueOnce([]);
    const result = await loadGroupsBySchoolYear(schoolYear);
    expect(result).toEqual([]);
  });
});

describe("loadCoursesBySchoolYearAndSemester", () => {
  it("returns mapped courses for a school year and semester", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 7, ZSUBJECT: 3, ZGROUP: 5, GROUPNAME: "5A", SUBJECTNAME: "Deutsch" },
    ]);

    const result = await loadCoursesBySchoolYearAndSemester(schoolYear, semester);

    expect(mockedSelect).toHaveBeenCalledWith(expect.any(String), [1, 2]);
    expect(result).toEqual([
      {
        id: 7,
        group: { id: 5, name: "5A", sortingName: undefined, students: undefined, type: undefined },
        semester: semester,
        subject: { id: 3, name: "Deutsch" },
        schoolYear: schoolYear,
        days: undefined,
      },
    ]);
  });

  it("returns empty array when no courses exist", async () => {
    mockedSelect.mockResolvedValueOnce([]);
    const result = await loadCoursesBySchoolYearAndSemester(schoolYear, semester);
    expect(result).toEqual([]);
  });
});
