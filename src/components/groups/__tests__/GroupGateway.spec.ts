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
  it("inserts a group with nextPrimaryKey and year mapping inside a transaction", async () => {
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 0 }]);
    mockedNextPrimaryKey.mockResolvedValueOnce(99);
    mockedExecute.mockResolvedValue({});

    await createGroup(group, schoolYear);

    expect(mockedNextPrimaryKey).toHaveBeenCalledWith("Group");
    expect(mockedExecute).toHaveBeenCalledWith(expect.stringContaining("BEGIN"));
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ZGROUP"),
      [99, Z_ENT.ZGROUP, 1, "Alpha", 1, "Alpha"],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO Z_3YEARS"),
      [1, 99],
    );
    expect(mockedExecute).toHaveBeenCalledWith(expect.stringContaining("COMMIT"));
  });

  it("prefixes the sorting name with '0' when group name starts with a digit", async () => {
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 0 }]);
    mockedNextPrimaryKey.mockResolvedValueOnce(100);
    mockedExecute.mockResolvedValue({});

    const numericGroup: Group = { ...group, name: "8B", sortingName: "8B" };
    await createGroup(numericGroup, schoolYear);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ZGROUP"),
      [100, Z_ENT.ZGROUP, 1, "8B", 1, "08B"],
    );
  });

  it("throws without inserting when the group name already exists in the school year", async () => {
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 1 }]);

    await expect(createGroup(group, schoolYear)).rejects.toThrow();

    expect(mockedExecute).not.toHaveBeenCalled();
  });
});

describe("updateGroup", () => {
  it("updates name, type, sorting name, and increments Z_OPT", async () => {
    mockedExecute.mockResolvedValueOnce({});

    await updateGroup(group);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("Z_OPT = Z_OPT + 1"),
      ["Alpha", 1, "Alpha", 10],
    );
  });
});

describe("assignStudentToGroup", () => {
  it("inserts the student-group mapping", async () => {
    mockedExecute.mockResolvedValueOnce({});

    await assignStudentToGroup(student, group);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO Z_3STUDENTS"),
      [20, 10],
    );
  });
});

describe("unassignStudentFromGroup", () => {
  it("deletes the student-group mapping", async () => {
    mockedExecute.mockResolvedValueOnce({});

    await unassignStudentFromGroup(student, group);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM Z_3STUDENTS"),
      [20, 10],
    );
  });
});

describe("deleteGroupInSchoolYear", () => {
  it("deletes all related records inside a transaction", async () => {
    mockedExecute.mockResolvedValue({});

    await deleteGroupInSchoolYear(group, schoolYear);

    const calls = mockedExecute.mock.calls.map((c) => c[0] as string);
    expect(calls[0]).toContain("BEGIN");
    expect(calls.some((s) => s.includes("DELETE FROM Z_3STUDENTS"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM Z_3YEARS"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM ZGRADE"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM ZPERFORMANCE"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM ZCOURSE"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM ZGROUP"))).toBe(true);
    expect(calls.at(-1)).toContain("COMMIT");
  });

  it("rolls back and rethrows on error", async () => {
    mockedExecute.mockResolvedValueOnce({});
    mockedExecute.mockRejectedValueOnce(new Error("db error"));
    mockedExecute.mockResolvedValue({});

    await expect(deleteGroupInSchoolYear(group, schoolYear)).rejects.toThrow("db error");

    const calls = mockedExecute.mock.calls.map((c) => c[0] as string);
    expect(calls.some((s) => s.includes("ROLLBACK"))).toBe(true);
  });
});
