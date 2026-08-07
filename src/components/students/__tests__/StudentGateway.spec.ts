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
} from "@/components/students/StudentGateway";

const { mockedSelect, mockedExecute } = vi.hoisted(() => ({
  mockedSelect: vi.fn(),
  mockedExecute: vi.fn(),
}));

vi.mock("@/store/Database", () => ({
  db: {
    select: mockedSelect,
    execute: mockedExecute,
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
  it("inserts the student and school year mapping", async () => {
    mockedExecute.mockResolvedValueOnce({ lastInsertId: 42 });
    mockedExecute.mockResolvedValueOnce({});

    await createStudentInSchoolYear(student, schoolYear);

    expect(mockedExecute).toHaveBeenCalledTimes(2);
    expect(mockedExecute).toHaveBeenNthCalledWith(
      1,
      "INSERT INTO ZSTUDENT (Z_ENT, ZFIRSTNAME, ZLASTNAME) VALUES ($1, $2, $3)",
      [6, "Max", "Muster"],
    );
    expect(mockedExecute).toHaveBeenNthCalledWith(
      2,
      "INSERT INTO Z_6YEARS (Z_6STUDENTS2, Z_8YEARS1) VALUES ($1, $2)",
      [42, 1],
    );
  });
});

describe("updateStudent", () => {
  it("updates first and last name", async () => {
    mockedExecute.mockResolvedValueOnce({});

    await updateStudent(student);

    expect(mockedExecute).toHaveBeenCalledWith(
      "UPDATE ZSTUDENT SET ZFIRSTNAME = $1, ZLASTNAME = $2 WHERE Z_PK = $3",
      ["Max", "Muster", 10],
    );
  });
});

describe("deleteStudentInSchoolYear", () => {
  it("deletes only the year mapping when the student still belongs to other years", async () => {
    mockedExecute.mockResolvedValueOnce({});
    mockedSelect.mockResolvedValueOnce({ "COUNT(*)": 1 });

    await deleteStudentInSchoolYear(student, schoolYear);

    expect(mockedExecute).toHaveBeenCalledTimes(1);
    expect(mockedExecute).toHaveBeenCalledWith(
      "DELETE FROM Z_6YEARS WHERE Z_6STUDENTS2 = $1 AND Z_8YEARS1 = $2",
      [10, 1],
    );
  });

  it("also deletes the student record when no year mappings remain", async () => {
    mockedExecute.mockResolvedValue({});
    mockedSelect.mockResolvedValueOnce({ "COUNT(*)": 0 });

    await deleteStudentInSchoolYear(student, schoolYear);

    expect(mockedExecute).toHaveBeenCalledTimes(2);
    expect(mockedExecute).toHaveBeenNthCalledWith(
      2,
      "DELETE FROM ZSTUDENT WHERE Z_PK = $1",
      [10],
    );
  });
});
