import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import { loadAll, createSchoolYear, updateSchoolYear, deleteSchoolYear } from "@/components/schoolYears/SchoolYearGateway";
import { coreDataToUnix } from "@/store/DateConversion";
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

const COREDATA_ZERO = 0;
const DATE_ZERO = coreDataToUnix(COREDATA_ZERO);

const schoolYear: SchoolYear = {
  id: 1,
  start: DATE_ZERO,
  end: DATE_ZERO,
  firstSemester: { id: 10, type: 1, start: DATE_ZERO, end: DATE_ZERO },
  secondSemester: { id: 11, type: 2, start: DATE_ZERO, end: DATE_ZERO },
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("loadAll", () => {
  it("returns school years with their semesters", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 1, ZSTART: COREDATA_ZERO, ZEND: COREDATA_ZERO },
    ]);
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 10, ZTYPEID: 1, ZSTART: COREDATA_ZERO, ZEND: COREDATA_ZERO },
      { Z_PK: 11, ZTYPEID: 2, ZSTART: COREDATA_ZERO, ZEND: COREDATA_ZERO },
    ]);

    const result = await loadAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1,
      firstSemester: { id: 10, type: 1 },
      secondSemester: { id: 11, type: 2 },
    });
  });

  it("returns empty array when no school years exist", async () => {
    mockedSelect.mockResolvedValueOnce([]);
    const result = await loadAll();
    expect(result).toEqual([]);
  });
});

describe("createSchoolYear", () => {
  it("inserts the school year and both semesters with nextPrimaryKey inside a transaction", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(1);
    mockedNextPrimaryKey.mockResolvedValueOnce(10);
    mockedNextPrimaryKey.mockResolvedValueOnce(11);
    mockedExecute.mockResolvedValue({});

    await createSchoolYear(schoolYear);

    expect(mockedNextPrimaryKey).toHaveBeenCalledWith(Z_ENT.ZYEAR);
    expect(mockedNextPrimaryKey).toHaveBeenCalledWith(Z_ENT.ZSEMESTER);
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ZYEAR"),
      [1, Z_ENT.ZYEAR, 1, expect.any(Number), expect.any(Number)],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ZSEMESTER"),
      [10, Z_ENT.ZSEMESTER, 1, 1, 1, expect.any(Number), expect.any(Number)],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ZSEMESTER"),
      [11, Z_ENT.ZSEMESTER, 1, 2, 1, expect.any(Number), expect.any(Number)],
    );
  });

  it("rethrows on error", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(1);
    mockedExecute.mockRejectedValueOnce(new Error("db error"));
    mockedExecute.mockResolvedValue({});

    await expect(createSchoolYear(schoolYear)).rejects.toThrow("db error");
  });
});

describe("updateSchoolYear", () => {
  it("updates the school year and both semesters with Z_OPT = Z_OPT + 1 inside a transaction", async () => {
    mockedExecute.mockResolvedValue({});

    await updateSchoolYear(schoolYear);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE ZYEAR"),
      [expect.any(Number), expect.any(Number), 1],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE ZSEMESTER"),
      [expect.any(Number), expect.any(Number), 10],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE ZSEMESTER"),
      [expect.any(Number), expect.any(Number), 11],
    );
  });
});

describe("deleteSchoolYear", () => {
  it("cascade-deletes all related data in the correct order inside a transaction", async () => {
    mockedExecute.mockResolvedValue({});

    await deleteSchoolYear(schoolYear);

    const calls = mockedExecute.mock.calls.map((c) => c[0] as string);
    expect(calls.some((s) => s.includes("DELETE FROM ZGRADE"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM ZPERFORMANCE"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM Z_1STUDENTS"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM ZCOURSE"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM Z_3YEARS"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM Z_6YEARS"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM Z_7YEARS"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM ZSEMESTER"))).toBe(true);
    expect(calls.some((s) => s.includes("DELETE FROM ZYEAR"))).toBe(true);

    const gradeIdx = calls.findIndex((s) => s.includes("DELETE FROM ZGRADE"));
    const perfIdx = calls.findIndex((s) => s.includes("DELETE FROM ZPERFORMANCE"));
    const courseIdx = calls.findIndex((s) => s.includes("DELETE FROM ZCOURSE"));
    const yearIdx = calls.findIndex((s) => s.includes("DELETE FROM ZYEAR"));
    expect(gradeIdx).toBeLessThan(perfIdx);
    expect(perfIdx).toBeLessThan(courseIdx);
    expect(courseIdx).toBeLessThan(yearIdx);
  });

  it("rethrows on error", async () => {
    mockedExecute.mockResolvedValueOnce({});
    mockedExecute.mockRejectedValueOnce(new Error("db error"));
    mockedExecute.mockResolvedValue({});

    await expect(deleteSchoolYear(schoolYear)).rejects.toThrow("db error");
  });
});
