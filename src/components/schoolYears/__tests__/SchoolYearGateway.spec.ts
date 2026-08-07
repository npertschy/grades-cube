import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import { loadAll, createSchoolYear, updateSchoolYear } from "@/components/schoolYears/SchoolYearGateway";
import { coreDataToUnix } from "@/store/DateConversion";

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
  it("inserts the school year and both semesters with Z_OPT = 1", async () => {
    mockedExecute.mockResolvedValueOnce({ lastInsertId: 1 });
    mockedExecute.mockResolvedValueOnce({});
    mockedExecute.mockResolvedValueOnce({});

    await createSchoolYear(schoolYear);

    expect(mockedExecute).toHaveBeenCalledTimes(3);
    expect(mockedExecute).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO ZYEAR"),
      [8, 1, expect.any(Number), expect.any(Number)],
    );
    expect(mockedExecute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO ZSEMESTER"),
      [5, 1, 1, 1, expect.any(Number), expect.any(Number)],
    );
    expect(mockedExecute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO ZSEMESTER"),
      [5, 1, 2, 1, expect.any(Number), expect.any(Number)],
    );
  });
});

describe("updateSchoolYear", () => {
  it("updates the school year and both semesters with Z_OPT = Z_OPT + 1", async () => {
    mockedExecute.mockResolvedValue({});

    await updateSchoolYear(schoolYear);

    expect(mockedExecute).toHaveBeenCalledTimes(3);
    expect(mockedExecute).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("Z_OPT = Z_OPT + 1"),
      [expect.any(Number), expect.any(Number), 1],
    );
    expect(mockedExecute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("Z_OPT = Z_OPT + 1"),
      [expect.any(Number), expect.any(Number), 10],
    );
    expect(mockedExecute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("Z_OPT = Z_OPT + 1"),
      [expect.any(Number), expect.any(Number), 11],
    );
  });
});
