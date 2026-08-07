import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Group } from "@/components/groups/Group";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Student } from "@/components/students/Student";
import {
  loadGroupsBySchoolYearAndSemester,
  loadStudentsByGroup,
  createGroup,
  deleteGroupInSchoolYear,
  updateGroup,
  assignStudentToGroup,
  unassignStudentFromGroup,
} from "@/components/groups/GroupGateway";

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

const group: Group = { id: 10, name: "Alpha", sortingName: "Alpha", type: 1, students: [] };
const student: Student = { id: 20, firstName: "Max", lastName: "Muster", groups: [], courses: [] };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("loadGroupsBySchoolYearAndSemester", () => {
  it("returns mapped groups for a school year", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 10, ZNAME: "5A", ZSORTINGNAME: "5A", ZTYPE: 1 },
    ]);

    const result = await loadGroupsBySchoolYearAndSemester(schoolYear);

    expect(mockedSelect).toHaveBeenCalledOnce();
    expect(result).toEqual([{ id: 10, name: "5A", sortingName: "5A", type: 1, students: [] }]);
  });

  it("returns empty array when no groups exist", async () => {
    mockedSelect.mockResolvedValueOnce([]);
    const result = await loadGroupsBySchoolYearAndSemester(schoolYear);
    expect(result).toEqual([]);
  });
});

describe("loadStudentsByGroup", () => {
  it("returns mapped students for a group", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 20, ZFIRSTNAME: "Max", ZLASTNAME: "Muster" },
    ]);

    const result = await loadStudentsByGroup(group);

    expect(mockedSelect).toHaveBeenCalledOnce();
    expect(result).toEqual([{ id: 20, firstName: "Max", lastName: "Muster", groups: [], courses: [] }]);
  });
});

describe("createGroup", () => {
  it("inserts a group and year mapping", async () => {
    mockedExecute.mockResolvedValueOnce({ lastInsertId: 99 });
    mockedExecute.mockResolvedValueOnce({});

    await createGroup(group, schoolYear);

    expect(mockedExecute).toHaveBeenCalledTimes(2);
    expect(mockedExecute).toHaveBeenNthCalledWith(
      1,
      "INSERT INTO ZGROUP (Z_ENT, ZNAME, ZTYPE, ZSORTINGNAME) VALUES (3, $1, $2, $3)",
      ["Alpha", 1, "Alpha"],
    );
    expect(mockedExecute).toHaveBeenNthCalledWith(
      2,
      "INSERT INTO Z_3YEARS (Z_8YEARS, Z_3GROUPS1) VALUES ($1, $2)",
      [1, 99],
    );
  });

  it("prefixes the sorting name with '0' when group name starts with a digit", async () => {
    mockedExecute.mockResolvedValueOnce({ lastInsertId: 100 });
    mockedExecute.mockResolvedValueOnce({});

    const numericGroup: Group = { ...group, name: "8B", sortingName: "8B" };
    await createGroup(numericGroup, schoolYear);

    expect(mockedExecute).toHaveBeenNthCalledWith(
      1,
      "INSERT INTO ZGROUP (Z_ENT, ZNAME, ZTYPE, ZSORTINGNAME) VALUES (3, $1, $2, $3)",
      ["8B", 1, "08B"],
    );
  });
});

describe("updateGroup", () => {
  it("updates name, type, and sorting name", async () => {
    mockedExecute.mockResolvedValueOnce({});

    await updateGroup(group);

    expect(mockedExecute).toHaveBeenCalledWith(
      "UPDATE ZGROUP SET ZNAME = $1, ZTYPE = $2, ZSORTINGNAME = $3 WHERE Z_PK = $4",
      ["Alpha", 1, "Alpha", 10],
    );
  });
});

describe("assignStudentToGroup", () => {
  it("inserts the student-group mapping", async () => {
    mockedExecute.mockResolvedValueOnce({});

    await assignStudentToGroup(student, group);

    expect(mockedExecute).toHaveBeenCalledWith(
      "INSERT INTO Z_3STUDENTS (Z_6STUDENTS1, Z_3GROUPS2) VALUES ($1, $2)",
      [20, 10],
    );
  });
});

describe("unassignStudentFromGroup", () => {
  it("deletes the student-group mapping", async () => {
    mockedExecute.mockResolvedValueOnce({});

    await unassignStudentFromGroup(student, group);

    expect(mockedExecute).toHaveBeenCalledWith(
      "DELETE FROM Z_3STUDENTS WHERE Z_6STUDENTS1 = $1 AND Z_3GROUPS2 = $2",
      [20, 10],
    );
  });
});

describe("deleteGroupInSchoolYear", () => {
  it("executes all deletion statements in order", async () => {
    mockedExecute.mockResolvedValue({});

    await deleteGroupInSchoolYear(group, schoolYear);

    expect(mockedExecute).toHaveBeenCalledTimes(6);
    expect(mockedExecute).toHaveBeenNthCalledWith(
      1, "DELETE FROM Z_3STUDENTS WHERE Z_3GROUPS2 = $1", [10],
    );
    expect(mockedExecute).toHaveBeenNthCalledWith(
      2, "DELETE FROM Z_3YEARS WHERE Z_3GROUPS1 = $1 AND Z_8YEARS = $2", [10, 1],
    );
    expect(mockedExecute).toHaveBeenNthCalledWith(
      6, "DELETE FROM ZGROUP WHERE Z_PK = $1", [10],
    );
  });
});
