import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Subject } from "@/components/subjects/Subject";
import {
  loadSubjectsBySchoolYear,
  createSubjectForSchoolYear,
  updateSubject,
  deleteSubjectFromSchoolYear,
  loadAll,
} from "@/components/subjects/SubjectGateway";
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

beforeEach(() => {
  vi.resetAllMocks();
});

describe("loadSubjectsBySchoolYear", () => {
  it("returns mapped subjects for a school year", async () => {
    mockedSelect.mockResolvedValueOnce([{ Z_PK: 7, ZNAME: "Deutsch" }]);

    const result = await loadSubjectsBySchoolYear(schoolYear);

    expect(mockedSelect).toHaveBeenCalledOnce();
    expect(result).toEqual([{ id: 7, name: "Deutsch" }]);
  });

  it("returns empty array when no subjects exist", async () => {
    mockedSelect.mockResolvedValueOnce([]);
    const result = await loadSubjectsBySchoolYear(schoolYear);
    expect(result).toEqual([]);
  });
});

describe("createSubjectForSchoolYear", () => {
  it("inserts a new subject and creates the year link when the name is globally unique", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(42);
    mockedExecute.mockResolvedValueOnce({ rowsAffected: 1 });  // INSERT OR IGNORE
    // link check: no existing link
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 0 }]);
    mockedExecute.mockResolvedValue({});  // INSERT Z_7YEARS + COMMIT

    const subject: Subject = { id: undefined, name: "Deutsch" };
    await createSubjectForSchoolYear(subject, schoolYear);

    expect(mockedNextPrimaryKey).toHaveBeenCalledWith(Z_ENT.ZSUBJECT);
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT OR IGNORE INTO ZSUBJECT"),
      [42, 7, 1, "Deutsch"],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO Z_7YEARS"),
      [42, 1],
    );
  });

  it("uses the existing subject's Z_PK and creates the year link when the name already exists globally", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(99);
    mockedExecute.mockResolvedValueOnce({ rowsAffected: 0 });  // INSERT OR IGNORE — ignored
    // SELECT existing subject
    mockedSelect.mockResolvedValueOnce([{ Z_PK: 7 }]);
    // link check: no existing link for this year
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 0 }]);
    mockedExecute.mockResolvedValue({});  // INSERT Z_7YEARS + COMMIT

    const subject: Subject = { id: undefined, name: "Deutsch" };
    await createSubjectForSchoolYear(subject, schoolYear);

    expect(mockedNextPrimaryKey).toHaveBeenCalledWith(Z_ENT.ZSUBJECT);
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO Z_7YEARS"),
      [7, 1],
    );
  });

  it("skips creating the year link when the subject is already linked to this school year", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(99);
    mockedExecute.mockResolvedValueOnce({ rowsAffected: 0 });  // INSERT OR IGNORE — ignored
    // SELECT existing subject
    mockedSelect.mockResolvedValueOnce([{ Z_PK: 7 }]);
    // link check: link already exists
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 1 }]);
    mockedExecute.mockResolvedValue({});  // COMMIT only

    const subject: Subject = { id: undefined, name: "Deutsch" };
    await createSubjectForSchoolYear(subject, schoolYear);

    expect(mockedExecute).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO Z_7YEARS"),
      expect.anything(),
    );
  });

  it("rethrows on error", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(42);
    mockedExecute.mockRejectedValueOnce(new Error("constraint violation"));
    mockedExecute.mockResolvedValue({});

    const subject: Subject = { id: undefined, name: "Deutsch" };
    await expect(createSubjectForSchoolYear(subject, schoolYear)).rejects.toThrow("constraint violation");
  });
});

describe("updateSubject", () => {
  it("updates the subject name and increments Z_OPT", async () => {
    mockedExecute.mockResolvedValueOnce({});

    const subject: Subject = { id: 7, name: "Mathematik" };
    await updateSubject(subject);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("Z_OPT = Z_OPT + 1"),
      ["Mathematik", 7],
    );
  });
});

describe("deleteSubjectFromSchoolYear", () => {
  it("deletes only the year link when the subject is still linked to other years", async () => {
    mockedExecute.mockResolvedValue({});
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 1 }]);

    const subject: Subject = { id: 7, name: "Deutsch" };
    await deleteSubjectFromSchoolYear(subject, schoolYear);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM Z_7YEARS"),
      [7, 1],
    );
    expect(mockedExecute).not.toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM ZSUBJECT"),
      expect.anything(),
    );
  });

  it("also deletes the subject record when no year links remain", async () => {
    mockedExecute.mockResolvedValue({});
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 0 }]);

    const subject: Subject = { id: 7, name: "Deutsch" };
    await deleteSubjectFromSchoolYear(subject, schoolYear);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM ZSUBJECT"),
      [7],
    );
  });
});

describe("loadAll", () => {
  it("returns all mapped subjects", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 7, ZNAME: "Deutsch" },
      { Z_PK: 8, ZNAME: "Mathematik" },
    ]);

    const result = await loadAll();

    expect(mockedSelect).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM ZSUBJECT"));
    expect(result).toEqual([
      { id: 7, name: "Deutsch" },
      { id: 8, name: "Mathematik" },
    ]);
  });

  it("returns empty array when no subjects exist", async () => {
    mockedSelect.mockResolvedValueOnce([]);
    const result = await loadAll();
    expect(result).toEqual([]);
  });
});
